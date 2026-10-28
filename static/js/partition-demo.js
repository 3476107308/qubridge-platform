(() => {
  'use strict';

  class PartitionDemo {
    constructor(root) {
      this.root = root;
      this.player = root.querySelector('.partition-player');
      this.image = root.querySelector('#partition-frame');
      this.topology = root.querySelector('#topology-select');
      this.play = root.querySelector('#partition-play');
      this.previous = root.querySelector('#partition-prev');
      this.next = root.querySelector('#partition-next');
      this.reset = root.querySelector('#partition-reset');
      this.slider = root.querySelector('#partition-step');
      this.stepTrack = root.querySelector('.partition-step-track');
      this.markers = root.querySelector('.partition-step-markers');
      this.timeline = root.querySelector('#partition-timeline');
      this.speed = root.querySelector('#partition-speed');
      this.status = root.querySelector('#partition-status');
      this.modeLabel = root.querySelector('#partition-mode');
      this.title = root.querySelector('#partition-step-title');
      this.description = root.querySelector('#partition-step-description');
      this.retry = root.querySelector('#partition-retry');
      this.algorithm = 'gsp';
      this.index = -1;
      this.revision = 0;
      this.playing = false;
      this.busy = true;
      this.error = false;
      this.timer = null;
      this.cache = new Map();

      root.querySelectorAll('.algo-btn').forEach(button => {
        button.addEventListener('click', () => {
          this.algorithm = button.dataset.algo;
          root.querySelectorAll('.algo-btn').forEach(choice => {
            const selected = choice === button;
            choice.classList.toggle('active', selected);
            choice.setAttribute('aria-pressed', String(selected));
          });
          this.selectDemo();
          this.log(`切换到 ${this.algorithm.toUpperCase()} 算法`);
        });
      });
      this.topology.addEventListener('change', () => {
        this.selectDemo();
        this.log(`切换到 ${this.topology.selectedOptions[0].textContent}`);
      });
      this.previous.addEventListener('click', () => this.seek(this.index - 1));
      this.next.addEventListener('click', () => this.seek(this.index + 1));
      this.reset.addEventListener('click', () => this.seek(0));
      this.slider.addEventListener('input', () => this.seek(Number(this.slider.value)));
      this.play.addEventListener('click', () => {
        if (this.playing) {
          this.pause();
          this.log('暂停分区演示');
        } else if (this.demo && this.index >= 0) {
          this.playing = true;
          this.updateControls();
          if (!this.continuous && this.index === this.demo.frames.length - 1) this.render(0);
          else this.schedule();
          this.log('开始播放分区演示');
        }
      });
      this.speed.addEventListener('change', () => {
        if (this.playing && !this.busy) this.schedule();
      });
      this.retry.addEventListener('click', () => {
        if (this.manifest) this.selectDemo();
        else this.loadManifest();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.pause();
      });
      window.addEventListener('pagehide', () => this.pause());
      this.loadManifest();
    }

    log(message) {
      if (typeof window.addToLog === 'function') window.addToLog(message);
    }

    async loadManifest() {
      this.busy = true;
      this.error = false;
      this.updateControls();
      try {
        const response = await fetch(this.root.dataset.manifest);
        if (!response.ok) throw new Error(`Manifest: ${response.status}`);
        const manifest = await response.json();
        if (manifest.version !== 1 || !manifest.demos) throw new Error('Invalid manifest');
        this.manifest = manifest.demos;
        this.selectDemo();
      } catch (error) {
        this.fail(error);
      }
    }

    selectDemo() {
      this.pause();
      if (!this.manifest) return;
      this.demo = this.manifest[`${this.algorithm}_${this.topology.value}`];
      if (!this.demo || !this.demo.frames.length) return this.fail(new Error('Missing demo'));
      this.continuous = this.demo.mode === 'continuous';
      this.index = -1;
      this.cache = new Map();
      this.image.style.visibility = 'hidden';
      this.previous.hidden = this.continuous;
      this.next.hidden = this.continuous;
      this.timeline.hidden = this.continuous;
      this.slider.max = String(this.demo.frames.length - 1);
      this.markers.replaceChildren();
      if (!this.continuous) {
        this.demo.frames.forEach((frame, index) => {
          const marker = document.createElement('span');
          marker.className = 'partition-step-marker';
          marker.dataset.step = String(index + 1);
          marker.style.setProperty('--step-position', `${index / Math.max(1, this.demo.frames.length - 1) * 100}%`);
          this.markers.append(marker);
        });
      }
      this.root.dataset.mode = this.demo.mode;
      this.root.dataset.demo = `${this.algorithm}_${this.topology.value}`;
      this.render(0);
    }

    getFrame(index) {
      const frame = this.demo.frames[index];
      if (!this.cache.has(index)) {
        const image = new Image();
        image.src = this.root.dataset.assets + frame.src;
        this.cache.set(index, image.decode().then(() => image));
      }
      return this.cache.get(index);
    }

    async render(index) {
      const revision = ++this.revision;
      this.targetIndex = index;
      this.busy = true;
      this.error = false;
      this.updateControls();
      try {
        const decoded = await this.getFrame(index);
        // Ignore outdated work after selection changes, manual seeks or pause.
        if (revision !== this.revision) return;
        this.index = index;
        this.image.src = decoded.src;
        this.image.width = this.demo.width;
        this.image.height = this.demo.height;
        this.image.style.visibility = 'visible';
        const frame = this.demo.frames[index];
        this.image.alt = `${this.algorithm.toUpperCase()} ${this.topology.selectedOptions[0].textContent}：${this.continuous ? '连续分区演示' : frame.title}`;
        this.busy = false;
        this.updateControls();
        // Only retain nearby decoded images, especially for continuous playback.
        const nextIndex = (index + 1) % this.demo.frames.length;
        for (const cachedIndex of this.cache.keys()) {
          if (cachedIndex !== index && cachedIndex !== nextIndex) this.cache.delete(cachedIndex);
        }
        const cache = this.cache;
        this.getFrame(nextIndex).catch(() => cache.delete(nextIndex));
        if (this.playing) this.schedule();
      } catch (error) {
        if (revision === this.revision) this.fail(error);
      }
    }

    pause() {
      clearTimeout(this.timer);
      this.timer = null;
      this.playing = false;
      ++this.revision;
      this.busy = false;
      this.updateControls();
    }

    seek(index) {
      if (!this.demo) return;
      this.pause();
      this.render(Math.max(0, Math.min(this.demo.frames.length - 1, index)));
    }

    schedule() {
      clearTimeout(this.timer);
      if (!this.playing || this.busy) return;
      const delay = this.demo.frames[this.index].duration / Number(this.speed.value);
      this.timer = setTimeout(() => {
        this.timer = null;
        if (this.playing) this.render((this.index + 1) % this.demo.frames.length);
      }, delay);
    }

    fail(error) {
      this.pause();
      this.error = true;
      this.updateControls();
      this.status.textContent = '演示加载失败';
      this.title.textContent = '暂时无法加载画面';
      this.description.textContent = '请点击重新加载演示后再试。';
      console.error('Partition demo could not load:', error);
    }

    updateControls() {
      const ready = Boolean(this.demo && this.index >= 0 && !this.error);
      const end = ready && this.index === this.demo.frames.length - 1;
      this.root.dataset.playing = String(this.playing);
      this.root.dataset.index = String(this.index);
      this.player.setAttribute('aria-busy', String(this.busy));
      this.previous.disabled = !ready || this.busy || this.index === 0;
      this.next.disabled = !ready || this.busy || end;
      // Loading a frame must not disable the range and cancel an ongoing drag.
      this.slider.disabled = !ready;
      this.reset.disabled = !ready;
      this.play.disabled = !ready;
      this.play.setAttribute('aria-pressed', String(this.playing));
      this.play.querySelector('span').textContent = this.playing ? '暂停' : this.continuous ? '播放动画' : end ? '重新播放' : '自动播放';
      this.retry.hidden = !this.error;
      this.modeLabel.textContent = this.continuous ? '连续演示' : '分步演示';
      if (!ready) {
        if (!this.error) this.status.textContent = '正在加载演示…';
        return;
      }
      if (this.continuous) {
        const status = this.playing ? '播放中' : '已暂停';
        if (this.status.textContent !== status) this.status.textContent = status;
        this.title.textContent = 'DQP · 自定义拓扑';
        this.description.textContent = '此拓扑保留连续动态演示，可随时暂停观察，或重新开始。';
      } else {
        const frame = this.demo.frames[this.index];
        const target = this.busy ? this.targetIndex : this.index;
        this.slider.value = String(target);
        this.slider.setAttribute('aria-valuetext', `第 ${target + 1} 步，共 ${this.demo.frames.length} 步，${this.demo.frames[target].title}`);
        this.stepTrack.style.setProperty('--step-progress', `${target / Math.max(1, this.demo.frames.length - 1) * 100}%`);
        Array.from(this.markers.children).forEach((marker, index) => {
          marker.classList.toggle('is-complete', index < target);
          marker.classList.toggle('is-current', index === target);
        });
        this.status.textContent = `第 ${this.index + 1} / ${this.demo.frames.length} 步 · ${this.playing ? '循环播放中' : end ? '已完成' : '已暂停'}`;
        this.title.textContent = frame.title;
        this.description.textContent = frame.description;
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('partition-demo');
    if (root) new PartitionDemo(root);
  });
})();
