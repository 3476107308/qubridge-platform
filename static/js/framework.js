/* Draggable QuBridge graph. Node positions use world coordinates; zoom only
   transforms their shared layer, so links and icons always move together. */
function initFrameworkVisualization() {
  const container = document.getElementById('framework-visualization');
  if (!container || container.querySelector('svg')) return;

  const initialNodes = [
    { id: 'input', name: '量子程序集', x: 90, y: 240, color: '#64748b' },
    { id: 'parallel', name: '并行管理器', x: 270, y: 240, color: '#7561df' },
    { id: 'compiler', name: '编译器', x: 470, y: 110, color: '#00a5e8' },
    { id: 'scheduler', name: '调度器', x: 470, y: 370, color: '#4663ed' },
    { id: 'hardware', name: '量子硬件', x: 660, y: 240, color: '#e66a3f' },
    { id: 'output', name: '执行结果', x: 830, y: 240, color: '#00a98d' }
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
  const details = new Set(['parallel', 'compiler', 'scheduler']);
  const svg = d3.select(container).append('svg')
    .attr('class', 'framework-canvas')
    .attr('tabindex', 0)
    .attr('role', 'group')
    .attr('aria-label', 'QuBridge 交互框架图')
    .attr('aria-describedby', 'framework-help');
  const defs = svg.append('defs');
  const grid = defs.append('pattern').attr('id', 'framework-grid')
    .attr('width', 32).attr('height', 32).attr('patternUnits', 'userSpaceOnUse');
  grid.append('circle').attr('cx', 1).attr('cy', 1).attr('r', 1).attr('fill', '#dfe6f0');
  defs.append('marker').attr('id', 'framework-arrow')
    .attr('viewBox', '0 -4 8 8').attr('refX', 8).attr('refY', 0)
    .attr('markerWidth', 7).attr('markerHeight', 7).attr('orient', 'auto')
    .append('path').attr('d', 'M0,-4L8,0L0,4Z').attr('fill', '#a9b6cb');
  svg.append('rect').attr('width', '100%').attr('height', '100%')
    .attr('fill', 'url(#framework-grid)').attr('aria-hidden', true);
  const world = svg.append('g').attr('class', 'framework-world');
  const edges = world.append('g').attr('aria-hidden', true).selectAll('line')
    .data(links).join('line').attr('class', 'framework-edge')
    .attr('marker-end', 'url(#framework-arrow)');
  const groups = world.append('g').selectAll('g').data(nodes).join('g')
    .attr('class', 'framework-node')
    .attr('data-node-id', node => node.id)
    .attr('style', node => `--node-color: ${node.color}`)
    .attr('tabindex', 0)
    .attr('role', node => details.has(node.id) ? 'button' : 'group')
    .attr('aria-label', node => `${node.name}，可拖动${details.has(node.id) ? '，点击查看详情' : ''}`);
  groups.append('title').text(node => `${node.name} · 拖动调整位置${details.has(node.id) ? ' · 点击查看详情' : ''}`);
  groups.append('circle').attr('class', 'node-halo').attr('r', 38);
  groups.append('circle').attr('class', 'node-disc').attr('r', 32);
  groups.append('g').attr('class', 'node-icon').attr('transform', 'translate(-15,-15) scale(1.25)')
    .attr('aria-hidden', true).html(node => icons[node.id]);
  groups.append('text').attr('class', 'node-label').attr('y', 59).text(node => node.name);

  function renderPositions() {
    groups.attr('transform', node => `translate(${node.x},${node.y})`);
    edges.each(function(link) {
      const dx = link.target.x - link.source.x;
      const dy = link.target.y - link.source.y;
      const distance = Math.hypot(dx, dy);
      // Hide links when discs overlap; avoid inverted arrows and NaN values.
      const offset = distance ? 34 / distance : 0;
      d3.select(this).attr('visibility', distance > 68 ? 'visible' : 'hidden')
        .attr('x1', link.source.x + dx * offset).attr('y1', link.source.y + dy * offset)
        .attr('x2', link.target.x - dx * offset).attr('y2', link.target.y - dy * offset);
    });
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
      world.attr('transform', event.transform);
      grid.attr('patternTransform', event.transform);
      zoomLevel.textContent = `${Math.round(event.transform.k * 100)}%`;
      zoomIn.disabled = event.transform.k >= maxZoom - 0.001;
      zoomOut.disabled = event.transform.k <= minZoom + 0.001;
    })
    .on('end', () => svg.classed('is-panning', false));
  svg.call(zoom).on('dblclick.zoom', null);
  groups.call(d3.drag().container(world.node()).clickDistance(5)
    .on('start', function() { d3.select(this).raise().classed('is-dragging', true); })
    .on('drag', (event, node) => {
      node.x = event.x;
      node.y = event.y;
      renderPositions();
    })
    .on('end', function() { d3.select(this).classed('is-dragging', false); }));
  groups.on('click', (event, node) => {
    if (!event.defaultPrevented && details.has(node.id)) showModuleDetails(node.id);
  }).on('keydown', (event, node) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      if (details.has(node.id)) showModuleDetails(node.id);
    }
  });

  let width = 0;
  let height = 0;
  function fitView() {
    const left = Math.min(...nodes.map(node => node.x)) - 65;
    const right = Math.max(...nodes.map(node => node.x)) + 65;
    const top = Math.min(...nodes.map(node => node.y)) - 45;
    const bottom = Math.max(...nodes.map(node => node.y)) + 72;
    const scale = Math.max(minZoom, Math.min(1, (width - 48) / (right - left), (height - 48) / (bottom - top)));
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(width / 2 - scale * (left + right) / 2, height / 2 - scale * (top + bottom) / 2)
      .scale(scale));
  }
  function resetLayout() {
    nodes.forEach((node, index) => Object.assign(node, initialNodes[index]));
    renderPositions();
    fitView();
  }
  zoomIn.addEventListener('click', () => svg.call(zoom.scaleBy, 1.25));
  zoomOut.addEventListener('click', () => svg.call(zoom.scaleBy, 0.8));
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
    event.preventDefault();
  });

  renderPositions();
  // Keep the same world point centered when the page or sidebar changes size.
  const observer = new ResizeObserver(() => {
    const previousWidth = width;
    const previousHeight = height;
    width = container.clientWidth;
    height = container.clientHeight;
    if (!width || !height) return;
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    if (!previousWidth) fitView();
    else {
      const transform = d3.zoomTransform(svg.node());
      svg.call(zoom.transform, d3.zoomIdentity
        .translate(transform.x + (width - previousWidth) / 2, transform.y + (height - previousHeight) / 2)
        .scale(transform.k));
    }
  });
  observer.observe(container);
}
