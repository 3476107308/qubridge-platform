/* Component information and the circuit-density tool. */
(() => {
  'use strict';
  const components = {
    input: {
      index: '01', description: '框架的程序入口，为后续选择、编译和调度提供待执行的量子线路。',
      input: '待执行的量子程序', output: '带有线路结构的候选程序集合',
      features: ['组织待执行的量子线路', '提供门操作与比特规模信息', '作为并行选择的候选集合'],
      detail: '程序集提供线路的基本结构。后续组件结合程序规模、门操作和硬件限制，决定哪些线路适合共同执行。',
      href: '/simulator', action: '进入量子模拟器'
    },
    parallel: {
      index: '02', description: '结合线路特征与硬件约束，选择适合共同执行的量子程序。',
      input: '量子程序集、硬件约束', output: '可并行执行的程序组合',
      features: ['分析线路密度与结构', '评估资源需求与程序约束', '选择并行执行组合'],
      detail: '并行管理器是QuBridge框架的核心组件之一，负责智能选择和组合可以并行执行的量子程序。它通过分析量子程序的特性、资源需求和依赖关系，确定最优的并行执行方案。',
      fullFeatures: ['分析量子程序的线路密度和结构特征', '评估程序间的依赖关系和冲突可能性', '基于硬件约束（如量子比特数、门操作限制）筛选程序', '使用启发式算法选择最优并行组合', '生成可并行执行的程序集合', '动态调整并行策略以适应硬件状态变化'],
      benefits: ['提高量子硬件的利用效率30-50%', '减少程序执行的等待时间', '最大化系统吞吐量', '支持动态程序调度'],
      href: '/simulator', action: '进入量子模拟器'
    },
    compiler: {
      index: '03', description: '对选定程序进行分区、映射与优化，衔接逻辑线路和目标硬件。',
      input: '已选程序、硬件拓扑', output: '面向目标硬件的量子指令',
      features: ['划分程序与分配量子比特', '优化门序列和线路映射', '处理拓扑约束下的路由'],
      detail: '编译器负责将选定的量子程序集进行分区和优化，使其适合在目标量子硬件上并行执行。它处理量子指令的转换、优化和资源分配，确保程序的高效执行。',
      fullFeatures: ['将大型量子程序分解为可并行执行的子任务', '优化量子门序列以减少执行时间和错误率', '管理量子比特资源的分配和映射', '处理程序间的通信和同步需求', '生成针对特定量子硬件的优化指令集', '支持多种量子编程语言和中间表示'],
      benefits: ['减少量子线路的深度达40%', '优化量子资源利用率', '提高程序执行的可靠性', '支持跨平台量子程序编译'],
      href: '/circuit-partition', action: '查看量子线路分区'
    },
    scheduler: {
      index: '04', description: '协调程序的执行顺序与资源使用，将编译结果组织为执行计划。',
      input: '程序组合、编译后的指令', output: '面向量子硬件的执行计划',
      features: ['安排程序的执行顺序', '协调并发任务的资源使用', '处理任务之间的资源冲突'],
      detail: '调度器管理量子硬件上的程序执行流程，协调多个程序的并发执行并解决资源冲突。它确保量子计算资源的高效利用和任务的及时完成。',
      fullFeatures: ['为并行程序分配执行时间窗口', '动态调整程序执行优先级', '监测和管理硬件资源使用情况', '解决程序间的资源冲突', '提供容错机制和错误恢复策略', '生成执行日志和性能报告'],
      benefits: ['确保程序执行的公平性和效率', '最大化量子硬件的利用率', '减少程序等待时间和完成时间', '提高系统整体吞吐量', '支持实时监控和干预'],
      href: '/demos', action: '查看算法演示'
    },
    hardware: {
      index: '05', description: '依据可用量子比特与连接拓扑，承接调度后的量子指令。',
      input: '已调度的量子指令', output: '测量数据与执行信息',
      features: ['提供物理量子比特资源', '约束可直接执行的双比特门', '执行线路并产生测量数据'],
      detail: '硬件的连接拓扑影响分区、映射和路由。量子硬件按照调度顺序执行量子门操作，并输出测量数据。',
      href: '/qubit-routing', action: '查看量子比特路由'
    },
    output: {
      index: '06', description: '汇集执行后的数据，为比较线路方案和分析实验提供依据。',
      input: '测量数据、执行记录', output: '可供比较与分析的结果',
      features: ['整理程序执行结果', '对比不同线路方案', '支持后续实验分析'],
      detail: '汇总程序的执行日志与性能报告，通过实验结果比较不同线路方案，为量子程序的进一步优化提供依据。',
      href: '/results', action: '查看实验结果'
    }
  };
  const panel = document.querySelector('.framework-inspector');
  const content = document.getElementById('inspector-content');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let selectedId = 'parallel';
  let inspectorAnimation;
  const allowMotion = () => !reducedMotion.matches && document.documentElement.dataset.pageMotion === '1';

  function updateInspector(node, icon) {
    const component = components[node.id];
    const changed = selectedId !== node.id;
    selectedId = node.id;
    panel.style.setProperty('--component-color', node.color);
    document.getElementById('inspector-index').textContent = `${component.index} / 06`;
    document.getElementById('inspector-icon').innerHTML = `<svg viewBox="0 0 26 26" aria-hidden="true">${icon}</svg>`;
    for (const [id, value] of Object.entries({name: node.name, caption: node.caption, description: component.description, input: component.input, output: component.output})) {
      document.getElementById(`inspector-${id}`).textContent = value;
    }
    document.getElementById('inspector-features').replaceChildren(...component.features.map(feature => {
      const item = document.createElement('li'); item.textContent = feature; return item;
    }));
    const detail = document.getElementById('inspector-detail');
    const description = document.createElement('p'); description.textContent = component.detail;
    detail.replaceChildren(description);
    for (const [heading, items] of [['主要功能', component.fullFeatures], ['优势特点', component.benefits]]) {
      if (!items) continue;
      const title = document.createElement('h4'); title.textContent = heading;
      const list = document.createElement('ul');
      list.replaceChildren(...items.map(text => { const item = document.createElement('li'); item.textContent = text; return item; }));
      detail.append(title, list);
    }
    const action = document.getElementById('inspector-action');
    action.href = component.href;
    action.querySelector('span').textContent = component.action;
    document.querySelectorAll('[data-component]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.component === node.id)));
    if (changed) {
      panel.querySelector('details').open = false;
      panel.querySelector('.inspector-scroll').scrollTop = 0;
      document.getElementById('inspector-announcement').textContent = `已显示${node.name}的组件说明`;
      inspectorAnimation?.cancel();
      if (allowMotion()) inspectorAnimation = content.animate([{opacity: .3, transform: 'translateY(5px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 180, easing: 'ease-out'});
    }
  }

  let graph;
  if (typeof d3 !== 'undefined') {
    graph = initFrameworkVisualization({ onSelect: updateInspector });
  } else {
    document.getElementById('framework-visualization').innerHTML = '<p class="framework-unavailable">架构图资源暂未加载，请刷新页面重试。仍可通过组件按钮查看说明。</p>';
    document.querySelectorAll('.framework-view-controls button').forEach(button => { button.disabled = true; });
  }
  document.querySelectorAll('[data-component]').forEach(button => button.addEventListener('click', () => {
    if (graph) graph.selectNode(button.dataset.component);
    else {
      const names = {parallel: '并行管理器', compiler: '编译器', scheduler: '调度器'};
      updateInspector({id: button.dataset.component, name: names[button.dataset.component], caption: 'CORE COMPONENT', color: '#afa0e9'}, '<path d="M5 5h16v16H5zM9 9h8v8H9z"/>');
    }
  }));

  const form = document.getElementById('density-form');
  const cnotInput = document.getElementById('cnot-count');
  const qubitInput = document.getElementById('qubit-count');
  const result = document.getElementById('density-result');
  const value = document.getElementById('density-value');
  const equation = document.getElementById('density-equation');
  const status = document.getElementById('density-status');
  let pendingCalculation;
  let resultAnimation;

  function readInteger(input, errorId) {
    const number = Number(input.value);
    const valid = input.value.trim() !== '' && Number.isSafeInteger(number) && number >= 1;
    input.setAttribute('aria-invalid', String(!valid));
    document.getElementById(errorId).textContent = valid ? '' : '请输入不小于 1 的整数（最大 9007199254740991）';
    return valid ? number : null;
  }
  function calculateDensity(animate = true) {
    clearTimeout(pendingCalculation);
    resultAnimation?.cancel();
    const cnot = readInteger(cnotInput, 'cnot-error');
    const qubits = readInteger(qubitInput, 'qubit-error');
    if (cnot === null || qubits === null) {
      result.dataset.state = 'invalid';
      value.textContent = '—';
      equation.textContent = '请先修正输入参数';
      status.textContent = '等待有效输入';
      return false;
    }
    const density = cnot / (qubits * qubits);
    const scientific = density >= 1e9 || density < .0005;
    result.dataset.state = 'ready';
    value.textContent = scientific ? density.toExponential(3) : density.toFixed(3);
    value.style.fontSize = value.textContent.length > 10 ? '30px' : '';
    equation.textContent = `${cnot} ÷ ${qubits}² = ${cnot} ÷ ${qubits * qubits}`;
    status.textContent = scientific ? '按当前输入计算 · 科学计数法' : '按当前输入计算 · 保留三位小数';
    if (animate && allowMotion()) resultAnimation = value.animate([{opacity: .4, transform: 'translateY(3px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 220, easing: 'ease-out'});
    return true;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!calculateDensity()) form.querySelector('[aria-invalid="true"]').focus();
  });
  form.addEventListener('input', () => {
    clearTimeout(pendingCalculation);
    result.dataset.state = 'pending';
    status.textContent = '参数已更改，正在更新';
    pendingCalculation = setTimeout(calculateDensity, 250);
  });
  document.getElementById('density-example').addEventListener('click', () => {
    cnotInput.value = '15'; qubitInput.value = '5'; calculateDensity();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) { inspectorAnimation?.cancel(); resultAnimation?.cancel(); }
  });
  calculateDensity(false);
})();
