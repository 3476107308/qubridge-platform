/* Draggable QuBridge graph. Node positions use world coordinates; zoom only
   transforms their shared layer, so links and icons always move together. */
function initFrameworkVisualization({ onSelect = () => {} } = {}) {
  const container = document.getElementById('framework-visualization');
  if (!container || container.querySelector('svg')) return;

  const initialNodes = [
    { id: 'input', name: '量子程序集', caption: 'PROGRAM INPUT', x: 90, y: 240, color: '#92aec5' },
    { id: 'parallel', name: '并行管理器', caption: 'PARALLEL MANAGER', x: 270, y: 240, color: '#afa0e9' },
    { id: 'compiler', name: '编译器', caption: 'COMPILER', x: 470, y: 110, color: '#82c7dc' },
    { id: 'scheduler', name: '调度器', caption: 'SCHEDULER', x: 470, y: 370, color: '#8faafa' },
    { id: 'hardware', name: '量子硬件', caption: 'QUANTUM HARDWARE', x: 660, y: 240, color: '#dbb17b' },
    { id: 'output', name: '执行结果', caption: 'EXECUTION RESULTS', x: 830, y: 240, color: '#81cdbb' }
  ];
  const nodes = initialNodes.map(node => ({ ...node }));
  const byId = new Map(nodes.map(node => [node.id, node]));
  const links = [
    ['input', 'parallel'], ['parallel', 'compiler'],
    ['parallel', 'scheduler'], ['compiler', 'scheduler'],
    ['scheduler', 'hardware'], ['hardware', 'output']
  ].map(([source, target]) => ({ source: byId.get(source), target: byId.get(target) }));

  // Original vector artwork: documents, parallel branches, code, scheduler,
  // processor and results. No font glyphs or emoji are used in these icons.
  const icons = {
    input: '<path d="M8 3h8l4 4v14H8z M16 3v5h4 M4 7v14a3 3 0 0 0 3 3 M11 12h6 M11 16h6"/>',
    parallel: '<rect x="2" y="10" width="5" height="5" rx="1"/><rect x="17" y="2" width="5" height="5" rx="1"/><rect x="17" y="10" width="5" height="5" rx="1"/><rect x="17" y="18" width="5" height="5" rx="1"/><path d="M7 12.5h5 M12 4.5v16 M12 4.5h5 M12 12.5h5 M12 20.5h5"/>',
    compiler: '<path d="m7 5-6 7 6 7 M17 5l6 7-6 7 M14 3l-4 18"/>',
    scheduler: '<path d="M4 3h11 M4 8h8 M4 13h5 M4 18h4"/><circle cx="16" cy="16" r="7"/><path d="M16 12v4l3 2"/>',
    hardware: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M8 1v4 M12 1v4 M16 1v4 M8 19v4 M12 19v4 M16 19v4 M1 8h4 M1 12h4 M1 16h4 M19 8h4 M19 12h4 M19 16h4"/>',
    output: '<path d="M2 3v19h21 M6 17v-5h3v5 M12 17V8h3v9 M18 17V3h3v14"/>'
  };
  const coreComponents = new Set(['parallel', 'compiler', 'scheduler']);
  let selectedNode = byId.get('parallel');
  let layoutEdited = false;
  let cameraEdited = false;
  let compactLayout = container.clientWidth < 600;
  function applyDefaultLayout() {
    const compactPositions = [[80, 60], [250, 60], [80, 220], [250, 220], [80, 380], [250, 380]];
    nodes.forEach((node, index) => {
      const position = compactLayout ? compactPositions[index] : [initialNodes[index].x, initialNodes[index].y];
      [node.x, node.y] = position;
    });
  }
  applyDefaultLayout();
  const svg = d3.select(container).append('svg')
    .attr('class', 'framework-canvas')
    .attr('tabindex', 0)
    .attr('role', 'group')
    .attr('aria-label', 'QuBridge 交互框架图')
    .attr('aria-describedby', 'framework-help');
  const defs = svg.append('defs');
  const grid = defs.append('pattern').attr('id', 'framework-grid')
    .attr('width', 36).attr('height', 36).attr('patternUnits', 'userSpaceOnUse');
  grid.append('circle').attr('cx', 1).attr('cy', 1).attr('r', .7)
    .attr('fill', '#91b3d0').attr('opacity', .17);
  const shadow = defs.append('filter').attr('id', 'framework-node-shadow')
    .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '220%');
  shadow.append('feDropShadow').attr('dx', 0).attr('dy', 8).attr('stdDeviation', 8)
    .attr('flood-color', '#010610').attr('flood-opacity', .4);
  nodes.forEach(node => {
    const gradient = defs.append('linearGradient').attr('id', `framework-surface-${node.id}`)
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', node.color).attr('stop-opacity', .16);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#0d1727').attr('stop-opacity', .8);
  });
  defs.append('marker').attr('id', 'framework-arrow')
    .attr('viewBox', '0 -4 8 8').attr('refX', 8).attr('refY', 0)
    .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
    .append('path').attr('d', 'M0,-3L7,0L0,3Z').attr('fill', '#7c9bb3').attr('opacity', .75);
  svg.append('rect').attr('width', '100%').attr('height', '100%')
    .attr('fill', 'url(#framework-grid)').attr('aria-hidden', true);
  const world = svg.append('g').attr('class', 'framework-world');
  const glows = world.append('g').attr('aria-hidden', true).selectAll('path')
    .data(links).join('path').attr('class', 'framework-edge-glow');
  const edges = world.append('g').attr('aria-hidden', true).selectAll('path')
    .data(links).join('path').attr('class', 'framework-edge')
    .attr('marker-end', 'url(#framework-arrow)');
  const groups = world.append('g').selectAll('g').data(nodes).join('g')
    .attr('class', 'framework-node')
    .attr('data-node-id', node => node.id)
    .attr('style', node => `--node-color: ${node.color}`)
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-controls', 'inspector-content')
    .attr('aria-label', node => `${node.name}，可拖动，点击查看组件说明`);
  groups.append('title').text(node => `${node.name} · 拖动调整位置 · 点击查看说明`);
  groups.append('rect').attr('class', 'node-halo').attr('x', -40).attr('y', -40)
    .attr('width', 80).attr('height', 80).attr('rx', 23);
  groups.append('rect').attr('class', 'node-base').attr('x', -32).attr('y', -32)
    .attr('width', 64).attr('height', 64).attr('rx', 17);
  groups.append('rect').attr('class', 'node-disc').attr('x', -32).attr('y', -32)
    .attr('width', 64).attr('height', 64).attr('rx', 17)
    .attr('fill', node => `url(#framework-surface-${node.id})`);
  groups.append('rect').attr('class', 'node-inset').attr('x', -26).attr('y', -26)
    .attr('width', 52).attr('height', 52).attr('rx', 12);
  groups.append('g').attr('class', 'node-icon').attr('transform', 'translate(-15,-15) scale(1.25)')
    .attr('aria-hidden', true).html(node => icons[node.id]);
  groups.filter(node => coreComponents.has(node.id)).append('circle').attr('class', 'node-core-mark')
    .attr('cx', 30).attr('cy', -30).attr('r', 2.5).attr('aria-hidden', true);
  groups.append('text').attr('class', 'node-label').attr('y', 60).text(node => node.name);
  groups.append('text').attr('class', 'node-caption').attr('y', 77).attr('aria-hidden', true).text(node => node.caption);

  function emphasize(node) {
    const focusNode = node || selectedNode;
    const related = link => link.source === focusNode || link.target === focusNode;
    edges.classed('is-related', related);
    glows.classed('is-related', related);
  }
  groups.on('pointerenter', (_, node) => emphasize(node)).on('pointerleave', () => emphasize(null))
    .on('focus', (_, node) => emphasize(node)).on('blur', () => emphasize(null));
  function selectNode(id) {
    const node = byId.get(id);
    if (!node) return;
    selectedNode = node;
    groups.classed('is-selected', item => item === node).attr('aria-pressed', item => item === node ? 'true' : 'false');
    emphasize(node);
    onSelect(node, icons[node.id]);
  }

  function renderPositions() {
    groups.attr('transform', node => `translate(${node.x},${node.y})`);
    links.forEach(link => {
      const dx = link.target.x - link.source.x;
      const dy = link.target.y - link.source.y;
      const distance = Math.hypot(dx, dy);
      // Clip paths outside the node frames, including while nodes overlap.
      const offset = distance ? 42 / distance : 0;
      const x1 = link.source.x + dx * offset, y1 = link.source.y + dy * offset;
      const x2 = link.target.x - dx * offset, y2 = link.target.y - dy * offset;
      link.visible = distance > 86;
      if (Math.abs(dx) >= Math.abs(dy)) {
        link.path = `M${x1},${y1} C${x1 + dx * .4},${y1} ${x2 - dx * .4},${y2} ${x2},${y2}`;
      } else {
        // A vertical connector starts outside the complete node, including its
        // labels, so it neither cuts through text nor crosses the outgoing path.
        const direction = Math.sign(dy);
        const startY = link.source.y + (direction > 0 ? 92 : -42);
        const endY = link.target.y + (direction > 0 ? -42 : 92);
        const bend = (endY - startY) * .4;
        link.visible = link.visible && direction * (endY - startY) > 10;
        link.path = `M${link.source.x},${startY} C${link.source.x},${startY + bend} ${link.target.x},${endY - bend} ${link.target.x},${endY}`;
      }
    });
    for (const selection of [edges, glows]) selection.attr('d', link => link.path)
      .attr('visibility', link => link.visible ? 'visible' : 'hidden');
  }

  const minZoom = 0.2;
  const maxZoom = 3;
  const zoomLevel = document.getElementById('framework-zoom-level');
  const zoomIn = document.getElementById('framework-zoom-in');
  const zoomOut = document.getElementById('framework-zoom-out');
  const zoom = d3.zoom().scaleExtent([minZoom, maxZoom])
    .filter(event => !event.button && (event.type === 'wheel' || !event.target.closest('.framework-node')))
    .on('start', () => svg.classed('is-panning', true))
    .on('zoom', event => {
      if (event.sourceEvent) cameraEdited = true;
      world.attr('transform', event.transform);
      grid.attr('patternTransform', event.transform);
      zoomLevel.textContent = `${Math.round(event.transform.k * 100)}%`;
      zoomIn.disabled = event.transform.k >= maxZoom - 0.001;
      zoomOut.disabled = event.transform.k <= minZoom + 0.001;
    })
    .on('end', () => svg.classed('is-panning', false));
  svg.call(zoom).on('dblclick.zoom', null);
  groups.call(d3.drag().container(world.node()).clickDistance(5)
    .on('start', function(_, node) { d3.select(this).raise().classed('is-dragging', true); emphasize(node); })
    .on('drag', (event, node) => {
      layoutEdited = true;
      node.x = event.x;
      node.y = event.y;
      renderPositions();
    })
    .on('end', function() { d3.select(this).classed('is-dragging', false); emphasize(null); }));
  groups.on('click', (event, node) => {
    if (!event.defaultPrevented) selectNode(node.id);
  }).on('keydown', (event, node) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      selectNode(node.id);
    }
  });

  let width = 0;
  let height = 0;
  function fitView() {
    cameraEdited = false;
    const left = Math.min(...nodes.map(node => node.x)) - 75;
    const right = Math.max(...nodes.map(node => node.x)) + 75;
    const top = Math.min(...nodes.map(node => node.y)) - 50;
    const bottom = Math.max(...nodes.map(node => node.y)) + (width < 600 ? 70 : 90);
    const padding = width < 600 ? 24 : 48;
    const scale = Math.max(minZoom, Math.min(1, (width - padding) / (right - left), (height - padding) / (bottom - top)));
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(width / 2 - scale * (left + right) / 2, height / 2 - scale * (top + bottom) / 2)
      .scale(scale));
  }
  function resetLayout() {
    layoutEdited = false;
    compactLayout = container.clientWidth < 600;
    applyDefaultLayout();
    renderPositions();
    fitView();
  }
  zoomIn.addEventListener('click', () => { cameraEdited = true; svg.call(zoom.scaleBy, 1.25); });
  zoomOut.addEventListener('click', () => { cameraEdited = true; svg.call(zoom.scaleBy, 0.8); });
  document.getElementById('framework-fit').addEventListener('click', fitView);
  document.getElementById('framework-reset').addEventListener('click', resetLayout);
  svg.on('keydown', event => {
    const directions = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] };
    if (event.key === '+' || event.key === '=') svg.call(zoom.scaleBy, 1.25);
    else if (event.key === '-') svg.call(zoom.scaleBy, 0.8);
    else if (event.key === '0') fitView();
    else if (directions[event.key]) {
      const transform = d3.zoomTransform(svg.node());
      const [dx, dy] = directions[event.key];
      svg.call(zoom.translateBy, dx / transform.k, dy / transform.k);
    } else return;
    if (event.key !== '0') cameraEdited = true;
    event.preventDefault();
  });

  renderPositions();
  selectNode('parallel');
  // Keep the same world point centered when the page or sidebar changes size.
  const observer = new ResizeObserver(() => {
    const previousWidth = width;
    const previousHeight = height;
    width = container.clientWidth;
    height = container.clientHeight;
    if (!width || !height) return;
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    const nextCompact = width < 600;
    if (!layoutEdited && !cameraEdited && nextCompact !== compactLayout) {
      compactLayout = nextCompact;
      applyDefaultLayout();
      renderPositions();
      fitView();
    } else if (!previousWidth || (!layoutEdited && !cameraEdited)) fitView();
    else {
      const transform = d3.zoomTransform(svg.node());
      svg.call(zoom.transform, d3.zoomIdentity
        .translate(transform.x + (width - previousWidth) / 2, transform.y + (height - previousHeight) / 2)
        .scale(transform.k));
    }
  });
  observer.observe(container);
  return { selectNode };
}
