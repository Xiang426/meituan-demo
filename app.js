(function () {
  "use strict";

  var STORAGE_KEY = "hezuguanjia-demo-v1";
  var SESSION_KEY = "hezuguanjia-session";
  var activeTab = "home";
  var billFilter = "all";
  var toastTimer;

  var NAV_ITEMS = [
    { id: "home", label: "首页", icon: "⌂" },
    { id: "bills", label: "账单", icon: "¥" },
    { id: "chores", label: "家务", icon: "✓" },
    { id: "shopping", label: "采购", icon: "▣" },
    { id: "profile", label: "我的", icon: "●" }
  ];

  var CATEGORY_META = {
    rent: { label: "房租", icon: "房" },
    utility: { label: "水电燃气", icon: "表" },
    internet: { label: "网络", icon: "网" },
    grocery: { label: "日用品", icon: "购" },
    meal: { label: "聚餐", icon: "餐" },
    other: { label: "其他", icon: "记" }
  };

  function localDateString(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }

  function isoDate(offset) {
    var d = new Date();
    d.setDate(d.getDate() + offset);
    return localDateString(d);
  }

  function freshState() {
    return {
      currentUserId: "xiang",
      room: {
        name: "阳光花园",
        code: "A-1902",
        address: "上海市浦东新区阳光花园 6号楼 1902",
        rentDueDay: 5,
        leaseEnd: "2027-03-31"
      },
      members: [
        { id: "xiang", name: "小象", role: "主租人", avatar: "象", phone: "188****0926", points: 92, choresDone: 8 },
        { id: "li", name: "小李", role: "次卧A", avatar: "李", phone: "186****3518", points: 86, choresDone: 7 },
        { id: "jie", name: "阿杰", role: "次卧B", avatar: "杰", phone: "177****6612", points: 75, choresDone: 5 },
        { id: "qiqi", name: "七喜", role: "阳光房", avatar: "七", phone: "139****2049", points: 81, choresDone: 6 }
      ],
      bills: [
        { id: 101, title: "9月房租", category: "rent", amount: 7200, payer: "li", participants: ["xiang", "li", "jie", "qiqi"], date: isoDate(-8), status: "pending" },
        { id: 102, title: "8月水电燃气", category: "utility", amount: 386.4, payer: "xiang", participants: ["xiang", "li", "jie", "qiqi"], date: isoDate(-5), status: "pending" },
        { id: 103, title: "家庭宽带", category: "internet", amount: 120, payer: "qiqi", participants: ["xiang", "li", "jie", "qiqi"], date: isoDate(-3), status: "pending" },
        { id: 104, title: "厨房清洁用品", category: "grocery", amount: 168.6, payer: "jie", participants: ["xiang", "jie", "qiqi"], date: isoDate(-1), status: "pending" },
        { id: 105, title: "周末火锅", category: "meal", amount: 296, payer: "xiang", participants: ["xiang", "li", "jie"], date: isoDate(-16), status: "settled" }
      ],
      chores: [
        { id: 201, title: "清理厨房台面", assignee: "li", date: isoDate(0), points: 10, status: "pending" },
        { id: 202, title: "倒垃圾与换垃圾袋", assignee: "qiqi", date: isoDate(0), points: 5, status: "pending" },
        { id: 203, title: "客厅吸尘拖地", assignee: "xiang", date: isoDate(1), points: 15, status: "pending" },
        { id: 204, title: "卫生间深度清洁", assignee: "jie", date: isoDate(2), points: 20, status: "pending" },
        { id: 205, title: "冰箱过期检查", assignee: "li", date: isoDate(-1), points: 8, status: "completed" }
      ],
      shopping: [
        { id: 301, name: "抽纸 12包", category: "日用品", requester: "qiqi", estimate: 39.9, status: "pending" },
        { id: 302, name: "洗衣液", category: "清洁", requester: "li", estimate: 56, status: "pending" },
        { id: 303, name: "垃圾袋", category: "清洁", requester: "xiang", estimate: 16.8, status: "purchased" },
        { id: 304, name: "饮用水 2箱", category: "食品", requester: "jie", estimate: 48, status: "billed" }
      ],
      utilities: [
        { id: "water", name: "水表", icon: "水", reading: "328.6", unit: "m³", updated: isoDate(-2) },
        { id: "power", name: "电表", icon: "电", reading: "1852.4", unit: "kWh", updated: isoDate(-2) },
        { id: "gas", name: "燃气表", icon: "气", reading: "226.9", unit: "m³", updated: isoDate(-7) }
      ],
      repairs: [
        { id: 401, title: "厨房水龙头渗水", creator: "jie", date: isoDate(-2), status: "处理中" }
      ],
      messages: [
        { id: 501, icon: "¥", title: "新账单待确认", body: "小李添加了9月房租，你需要支付 ¥1,800.00", time: "10分钟前", read: false },
        { id: 502, icon: "✓", title: "今日家务提醒", body: "你今天需要完成客厅吸尘拖地", time: "1小时前", read: false },
        { id: 503, icon: "购", title: "采购状态更新", body: "垃圾袋已由小象购买，可转为AA账单", time: "昨天", read: true }
      ],
      rules: [
        "公共区域使用后及时恢复整洁",
        "晚间23:00后控制音量",
        "公共采购超过100元需提前在群内确认",
        "访客留宿请至少提前一天告知室友"
      ]
    };
  }

  function loadState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved && saved.members && saved.bills ? saved : freshState();
    } catch (error) {
      return freshState();
    }
  }

  var state = loadState();

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(value) {
    return "¥" + Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function member(id) {
    return state.members.find(function (item) { return item.id === id; }) || state.members[0];
  }

  function formatDate(dateString) {
    var d = new Date(dateString + "T00:00:00");
    return (d.getMonth() + 1) + "月" + d.getDate() + "日";
  }

  function statusHtml(status) {
    var map = {
      pending: ["pending", "待处理"],
      settled: ["done", "已结清"],
      completed: ["done", "已完成"],
      purchased: ["info", "已购买"],
      billed: ["done", "已入账"]
    };
    var item = map[status] || ["pending", escapeHtml(status)];
    return '<span class="status ' + item[0] + '">' + item[1] + "</span>";
  }

  function showToast(message) {
    var toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2400);
  }

  function renderNav() {
    var html = NAV_ITEMS.map(function (item) {
      return '<button class="nav-item ' + (activeTab === item.id ? "active" : "") + '" type="button" data-tab="' + item.id + '">'
        + '<span class="nav-icon" aria-hidden="true">' + item.icon + "</span>"
        + "<span>" + item.label + "</span></button>";
    }).join("");
    document.getElementById("desktop-nav").innerHTML = html;
    document.getElementById("mobile-nav").innerHTML = html;
  }

  function getBalances() {
    var balances = {};
    state.members.forEach(function (person) { balances[person.id] = 0; });
    state.bills.filter(function (bill) { return bill.status === "pending"; }).forEach(function (bill) {
      var share = Number(bill.amount) / bill.participants.length;
      bill.participants.forEach(function (id) {
        if (id !== bill.payer) {
          balances[id] -= share;
          balances[bill.payer] += share;
        }
      });
    });
    return balances;
  }

  function getSettlements() {
    var balances = getBalances();
    var creditors = [];
    var debtors = [];
    Object.keys(balances).forEach(function (id) {
      var value = Math.round(balances[id] * 100) / 100;
      if (value > 0.01) creditors.push({ id: id, amount: value });
      if (value < -0.01) debtors.push({ id: id, amount: -value });
    });
    creditors.sort(function (a, b) { return b.amount - a.amount; });
    debtors.sort(function (a, b) { return b.amount - a.amount; });
    var result = [];
    var i = 0;
    var j = 0;
    while (i < debtors.length && j < creditors.length) {
      var amount = Math.min(debtors[i].amount, creditors[j].amount);
      result.push({ from: debtors[i].id, to: creditors[j].id, amount: Math.round(amount * 100) / 100 });
      debtors[i].amount -= amount;
      creditors[j].amount -= amount;
      if (debtors[i].amount < 0.01) i += 1;
      if (creditors[j].amount < 0.01) j += 1;
    }
    return result;
  }

  function pageHeading(kicker, title, description, actions) {
    return '<header class="page-heading"><div><span class="eyebrow">' + kicker + '</span><h1>' + title + '</h1><p>' + description + '</p></div>'
      + '<div class="heading-actions">' + (actions || "") + "</div></header>";
  }

  function renderHome() {
    var balances = getBalances();
    var mine = balances[state.currentUserId] || 0;
    var pendingBills = state.bills.filter(function (bill) { return bill.status === "pending"; });
    var today = isoDate(0);
    var todayChores = state.chores.filter(function (chore) { return chore.date === today && chore.status !== "completed"; });
    var settlements = getSettlements();
    var recentBills = state.bills.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 4);
    var currentName = member(state.currentUserId).name;
    var greeting = new Date().getHours() < 12 ? "早上好" : new Date().getHours() < 18 ? "下午好" : "晚上好";

    var billRows = recentBills.map(function (bill) {
      var meta = CATEGORY_META[bill.category] || CATEGORY_META.other;
      return '<div class="list-row"><div class="list-icon">' + meta.icon + '</div><div class="list-content"><strong>' + escapeHtml(bill.title)
        + '</strong><small>' + escapeHtml(member(bill.payer).name) + " 支付 · " + bill.participants.length + "人分摊</small></div>"
        + '<div class="list-value"><strong>' + money(bill.amount) + "</strong><small>" + formatDate(bill.date) + "</small></div></div>";
    }).join("");

    var choreRows = todayChores.length ? todayChores.map(function (chore) {
      return '<div class="list-row"><div class="chore-person">' + member(chore.assignee).avatar + '</div><div class="list-content"><strong>' + escapeHtml(chore.title)
        + '</strong><small>' + member(chore.assignee).name + " · 完成可得 " + chore.points + ' 积分</small></div><button class="square-action" type="button" data-action="toggle-chore" data-id="' + chore.id + '" aria-label="标记完成">✓</button></div>';
    }).join("") : '<div class="empty-state"><b>今天没有待办家务</b>公共区域保持得不错</div>';

    var settlementRows = settlements.length ? settlements.slice(0, 3).map(function (item) {
      return '<div class="settlement-card"><span>' + member(item.from).name + " 转给 " + member(item.to).name + '</span><div class="settlement-line"><strong>待结算</strong><strong>' + money(item.amount) + "</strong></div></div>";
    }).join("") : '<div class="empty-state"><b>账目已经结清</b>当前没有待转账记录</div>';

    return '<section class="hero-band"><div class="hero-copy"><span class="hero-date">' + formatDate(today) + " · " + greeting + '</span><h1>' + currentName
      + '，今天也把合租生活安排得明明白白。</h1><p>阳光花园 A-1902 的账单、家务和采购都汇总在这里。</p></div>'
      + '<div class="hero-stats"><div class="hero-stat"><span>我的净额</span><strong>' + (mine >= 0 ? "待收 " : "待付 ") + money(Math.abs(mine))
      + '</strong></div><div class="hero-stat"><span>待结账单</span><strong>' + pendingBills.length + ' 笔</strong></div><div class="hero-stat"><span>今日家务</span><strong>'
      + todayChores.length + ' 项</strong></div><div class="hero-stat"><span>采购待办</span><strong>' + state.shopping.filter(function (x) { return x.status === "pending"; }).length + ' 件</strong></div></div></section>'
      + '<section class="quick-actions"><button class="quick-action" type="button" data-action="add-bill"><span class="quick-icon">¥</span><span><b>记一笔</b><small>添加AA账单</small></span></button>'
      + '<button class="quick-action" type="button" data-action="add-chore"><span class="quick-icon">✓</span><span><b>排家务</b><small>分配本周任务</small></span></button>'
      + '<button class="quick-action" type="button" data-action="add-shopping"><span class="quick-icon">购</span><span><b>加采购</b><small>共享购物清单</small></span></button>'
      + '<button class="quick-action" type="button" data-action="add-repair"><span class="quick-icon">修</span><span><b>报个修</b><small>记录房屋问题</small></span></button></section>'
      + '<div class="dashboard-grid"><div class="stack"><section class="section-block"><header class="section-header"><div><h2>今日家务</h2><p>完成后自动计入本周积分</p></div><button class="link-button" data-tab="chores">查看排班</button></header><div class="list">' + choreRows + '</div></section>'
      + '<section class="section-block"><header class="section-header"><div><h2>最近账单</h2><p>当前房间的费用流水</p></div><button class="link-button" data-tab="bills">全部账单</button></header><div class="list">' + billRows + "</div></section></div>"
      + '<div class="stack"><section class="section-block"><header class="section-header"><div><h2>最简结算</h2><p>自动合并室友之间的转账</p></div></header>' + settlementRows + '</section>'
      + '<section class="section-block"><header class="section-header"><div><h2>房间提醒</h2><p>接下来需要留意</p></div></header><div class="list">'
      + '<div class="list-row"><div class="list-icon">租</div><div class="list-content"><strong>下月房租</strong><small>每月' + state.room.rentDueDay + '日缴纳</small></div><span class="status pending">待准备</span></div>'
      + '<div class="list-row"><div class="list-icon">修</div><div class="list-content"><strong>' + escapeHtml(state.repairs[0] ? state.repairs[0].title : "暂无报修") + '</strong><small>' + (state.repairs[0] ? state.repairs[0].status : "房屋状态良好") + '</small></div><span class="status info">跟进中</span></div>'
      + "</div></section></div></div>";
  }

  function renderBills() {
    var balances = getBalances();
    var pending = state.bills.filter(function (bill) { return bill.status === "pending"; });
    var total = pending.reduce(function (sum, bill) { return sum + Number(bill.amount); }, 0);
    var mine = balances[state.currentUserId] || 0;
    var visible = state.bills.filter(function (bill) { return billFilter === "all" || bill.status === billFilter; });
    var items = visible.map(function (bill) {
      var meta = CATEGORY_META[bill.category] || CATEGORY_META.other;
      return '<article class="bill-item"><div class="bill-icon">' + meta.icon + '</div><div class="bill-main"><strong>' + escapeHtml(bill.title)
        + '</strong><small>' + meta.label + " · " + member(bill.payer).name + " 付款 · " + bill.participants.map(function (id) { return member(id).name; }).join("、") + '</small></div>'
        + '<strong class="bill-amount">' + money(bill.amount) + '<small>' + formatDate(bill.date) + "</small></strong>" + statusHtml(bill.status) + "</article>";
    }).join("");

    var settlements = getSettlements();
    var settleHtml = settlements.length ? settlements.map(function (item) {
      return '<div class="settlement-card"><span>' + member(item.from).name + " → " + member(item.to).name + '</span><div class="settlement-line"><strong>合并转账</strong><strong>' + money(item.amount) + "</strong></div></div>";
    }).join("") : '<div class="empty-state"><b>没有待结金额</b>所有AA账单都已结清</div>';

    return pageHeading("AA账本", "账单与结算", "每笔费用都有出处，每个人都算得清楚", '<button class="secondary-button" data-action="settle-all">全部结清</button><button class="primary-button" data-action="add-bill">＋ 记一笔</button>')
      + '<section class="metric-grid"><div class="metric"><span>待结总额</span><strong>' + money(total) + '</strong><small>' + pending.length + '笔账单</small></div>'
      + '<div class="metric ' + (mine >= 0 ? "positive" : "negative") + '"><span>我的净额</span><strong>' + (mine >= 0 ? "+" : "-") + money(Math.abs(mine)) + '</strong><small>' + (mine >= 0 ? "应收" : "应付") + '</small></div>'
      + '<div class="metric"><span>本月账单</span><strong>' + state.bills.length + '笔</strong><small>含已结清记录</small></div><div class="metric"><span>结算路径</span><strong>' + settlements.length + '条</strong><small>已自动合并</small></div></section>'
      + '<div class="dashboard-grid"><section><div class="filter-bar"><div class="segment"><button class="' + (billFilter === "all" ? "active" : "") + '" data-action="bill-filter" data-filter="all">全部</button>'
      + '<button class="' + (billFilter === "pending" ? "active" : "") + '" data-action="bill-filter" data-filter="pending">待结</button><button class="' + (billFilter === "settled" ? "active" : "") + '" data-action="bill-filter" data-filter="settled">已结清</button></div></div>'
      + '<div class="bill-list">' + (items || '<div class="section-block empty-state"><b>这里还没有账单</b>点击“记一笔”开始记录</div>') + '</div></section>'
      + '<aside class="section-block"><header class="section-header"><div><h2>最简结算方案</h2><p>用尽量少的转账完成本轮结算</p></div></header>' + settleHtml + "</aside></div>";
  }

  function weekDays() {
    var names = ["日", "一", "二", "三", "四", "五", "六"];
    var start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    var days = [];
    for (var i = 0; i < 7; i += 1) {
      var d = new Date(start);
      d.setDate(start.getDate() + i);
      var dayString = localDateString(d);
      days.push({ iso: dayString, week: "周" + names[d.getDay()], day: d.getDate(), today: dayString === isoDate(0) });
    }
    return days;
  }

  function renderChores() {
    var days = weekDays();
    var strip = days.map(function (day) {
      var hasTask = state.chores.some(function (chore) { return chore.date === day.iso && chore.status !== "completed"; });
      return '<div class="day-cell ' + (day.today ? "today " : "") + (hasTask ? "has-task" : "") + '"><span>' + day.week + "</span><b>" + day.day + "</b></div>";
    }).join("");
    var chores = state.chores.slice().sort(function (a, b) { return a.date.localeCompare(b.date); }).map(function (chore) {
      var done = chore.status === "completed";
      return '<article class="chore-item ' + (done ? "completed" : "") + '"><div class="chore-person">' + member(chore.assignee).avatar + '</div><div class="chore-info"><strong>' + escapeHtml(chore.title)
        + '</strong><small>' + formatDate(chore.date) + " · " + member(chore.assignee).name + " · " + chore.points + '积分</small></div><div class="chore-actions">'
        + statusHtml(chore.status) + '<button class="square-action ' + (done ? "completed" : "") + '" type="button" data-action="toggle-chore" data-id="' + chore.id + '" aria-label="' + (done ? "恢复任务" : "标记完成") + '">✓</button></div></article>';
    }).join("");
    var maxPoints = Math.max.apply(null, state.members.map(function (x) { return x.points; }));
    var scores = state.members.slice().sort(function (a, b) { return b.points - a.points; }).map(function (person, index) {
      return '<div class="score-row"><b>' + (index + 1) + '</b><div><div class="list-row" style="padding:0;border:0"><div class="list-content"><strong>' + person.name
        + '</strong></div><span>' + person.points + '分</span></div><div class="score-bar"><i style="width:' + Math.round(person.points / maxPoints * 100) + '%"></i></div></div><small>' + person.choresDone + '次</small></div>';
    }).join("");
    return pageHeading("轮班表", "本周家务", "任务轮流做，完成有记录，临时也能换班", '<button class="secondary-button" data-action="rotate-chores">↻ 下周轮换</button><button class="primary-button" data-action="add-chore">＋ 安排家务</button>')
      + '<div class="dashboard-grid"><div><section class="week-strip">' + strip + '</section><div class="chore-board">' + chores + '</div></div>'
      + '<aside class="stack"><section class="section-block"><header class="section-header"><div><h2>本周积分榜</h2><p>积分来自已完成的家务</p></div></header><div class="scoreboard">' + scores + '</div></section>'
      + '<section class="section-block"><header class="section-header"><div><h2>轮班规则</h2><p>公平分配，也允许灵活调整</p></div></header><div class="list"><div class="list-row"><div class="list-icon">1</div><div class="list-content"><strong>每周一自动轮换</strong><small>按成员顺序循环分配</small></div></div><div class="list-row"><div class="list-icon">2</div><div class="list-content"><strong>完成后获得积分</strong><small>难度越高，积分越多</small></div></div></div></section></aside></div>';
  }

  function renderShopping() {
    var pending = state.shopping.filter(function (item) { return item.status === "pending"; });
    var total = pending.reduce(function (sum, item) { return sum + Number(item.estimate); }, 0);
    var items = state.shopping.map(function (item) {
      var purchased = item.status === "purchased" || item.status === "billed";
      return '<article class="shopping-item ' + (purchased ? "purchased" : "") + '"><button class="shopping-check" type="button" data-action="toggle-shopping" data-id="' + item.id + '" aria-label="切换购买状态">' + (purchased ? "✓" : "") + '</button>'
        + '<div class="shopping-body"><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(item.category) + " · " + member(item.requester).name + ' 添加</small><div class="shopping-meta"><b>' + money(item.estimate) + "</b>" + statusHtml(item.status) + '</div>'
        + '<div class="shopping-actions">' + (item.status === "purchased" ? '<button class="chip-button" data-action="shopping-to-bill" data-id="' + item.id + '">转为AA账单</button>' : "") + '<button class="chip-button" data-action="delete-shopping" data-id="' + item.id + '">删除</button></div></div></article>';
    }).join("");
    return pageHeading("共享清单", "公共采购", "需要什么一起记，买完直接进入AA账本", '<button class="primary-button" data-action="add-shopping">＋ 添加物品</button>')
      + '<section class="metric-grid"><div class="metric"><span>待购买</span><strong>' + pending.length + '件</strong><small>共享清单</small></div><div class="metric"><span>预计花费</span><strong>' + money(total)
      + '</strong><small>按待购商品统计</small></div><div class="metric"><span>已购买</span><strong>' + state.shopping.filter(function (x) { return x.status === "purchased"; }).length
      + '件</strong><small>等待入账</small></div><div class="metric"><span>已入账</span><strong>' + state.shopping.filter(function (x) { return x.status === "billed"; }).length + '件</strong><small>进入AA账本</small></div></section>'
      + '<div class="shopping-grid">' + (items || '<div class="section-block empty-state"><b>采购清单是空的</b>想到需要的物品就加进来</div>') + "</div>";
  }

  function renderProfile() {
    var balances = getBalances();
    var members = state.members.map(function (person) {
      var balance = balances[person.id] || 0;
      return '<article class="member-card"><div class="member-head"><div class="member-avatar">' + person.avatar + '</div><div><strong>' + person.name + (person.id === state.currentUserId ? "（我）" : "")
        + '</strong><small>' + person.role + " · " + person.phone + '</small></div></div><div class="member-stats"><div><span>当前净额</span><b style="color:' + (balance >= 0 ? "var(--green)" : "var(--red)") + '">' + (balance >= 0 ? "+" : "-") + money(Math.abs(balance))
        + '</b></div><div><span>家务积分</span><b>' + person.points + '分</b></div></div></article>';
    }).join("");
    var utilities = state.utilities.map(function (item) {
      return '<article class="utility-card"><header><b>' + item.icon + " " + item.name + '</b><button class="link-button" data-action="update-utility" data-id="' + item.id + '">抄表</button></header><strong>' + item.reading + " " + item.unit + '</strong><small>更新于 ' + formatDate(item.updated) + "</small></article>";
    }).join("");
    var repairs = state.repairs.map(function (item) {
      return '<div class="list-row"><div class="list-icon">修</div><div class="list-content"><strong>' + escapeHtml(item.title) + '</strong><small>' + member(item.creator).name + " · " + formatDate(item.date) + '</small></div><span class="status ' + (item.status === "已完成" ? "done" : "info") + '">' + item.status + "</span></div>";
    }).join("");
    return pageHeading("房间与成员", "我的合租房", "管理成员、房屋信息和生活规则", '<button class="secondary-button" data-action="reset-demo">恢复示例数据</button><button class="danger-button" data-action="logout">退出登录</button>')
      + '<section class="section-block" style="margin-bottom:18px"><header class="section-header"><div><h2>室友成员</h2><p>' + state.room.name + " " + state.room.code + '</p></div><button class="link-button" data-action="invite">邀请室友</button></header><div class="member-grid">' + members + '</div></section>'
      + '<section class="section-block" style="margin-bottom:18px"><header class="section-header"><div><h2>水电燃气</h2><p>最近一次公共表读数</p></div></header><div class="utility-grid">' + utilities + '</div></section>'
      + '<div class="dashboard-grid"><section class="section-block"><header class="section-header"><div><h2>房屋报修</h2><p>公共设施问题共同跟进</p></div><button class="link-button" data-action="add-repair">新增报修</button></header><div class="list">' + (repairs || '<div class="empty-state"><b>暂无报修</b>房屋设施状态良好</div>') + '</div></section>'
      + '<section class="section-block"><header class="section-header"><div><h2>合租公约</h2><p>入住时共同确认</p></div></header><ol class="rule-list">' + state.rules.map(function (rule) { return "<li>" + escapeHtml(rule) + "</li>"; }).join("") + "</ol></section></div>";
  }

  function renderPage() {
    renderNav();
    var renderers = { home: renderHome, bills: renderBills, chores: renderChores, shopping: renderShopping, profile: renderProfile };
    document.getElementById("page-content").innerHTML = (renderers[activeTab] || renderHome)();
    document.getElementById("message-dot").style.display = state.messages.some(function (x) { return !x.read; }) ? "block" : "none";
    window.scrollTo(0, 0);
  }

  function openModal(kicker, title, body) {
    var modal = document.getElementById("modal");
    modal.innerHTML = document.getElementById("modal-shell-template").innerHTML;
    modal.querySelector("#modal-kicker").textContent = kicker;
    modal.querySelector("#modal-title").textContent = title;
    modal.querySelector("#modal-body").innerHTML = body;
    var backdrop = document.getElementById("modal-backdrop");
    backdrop.classList.remove("is-hidden");
    backdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(function () {
      var first = modal.querySelector("input, select, textarea, button");
      if (first) first.focus();
    }, 20);
  }

  function closeModal() {
    var backdrop = document.getElementById("modal-backdrop");
    backdrop.classList.add("is-hidden");
    backdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function memberChecks() {
    return '<div class="check-grid">' + state.members.map(function (person) {
      return '<label class="check-option"><input type="checkbox" name="participants" value="' + person.id + '" checked><span>' + person.name + "</span></label>";
    }).join("") + "</div>";
  }

  function openBillModal() {
    openModal("AA账本", "添加一笔费用", '<form id="bill-form"><div class="form-grid"><div class="full"><label class="field-label" for="bill-title">账单名称</label><input id="bill-title" name="title" required placeholder="例如：本月水电费"></div>'
      + '<div><label class="field-label" for="bill-amount">金额</label><input id="bill-amount" name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00"></div>'
      + '<div><label class="field-label" for="bill-category">分类</label><select id="bill-category" name="category"><option value="utility">水电燃气</option><option value="rent">房租</option><option value="grocery">日用品</option><option value="meal">聚餐</option><option value="internet">网络</option><option value="other">其他</option></select></div>'
      + '<div class="full"><label class="field-label" for="bill-payer">付款人</label><select id="bill-payer" name="payer">' + state.members.map(function (person) { return '<option value="' + person.id + '">' + person.name + "</option>"; }).join("") + '</select></div>'
      + '<div class="full"><label class="field-label">参与分摊</label>' + memberChecks() + '</div></div><div class="modal-actions"><button class="secondary-button" type="button" data-action="close-modal">取消</button><button class="primary-button" type="submit">保存账单</button></div></form>');
  }

  function openChoreModal() {
    openModal("家务排班", "安排一项家务", '<form id="chore-form"><label class="field-label" for="chore-title">家务内容</label><input id="chore-title" name="title" required placeholder="例如：清理公共冰箱">'
      + '<div class="form-grid"><div><label class="field-label" for="chore-assignee">负责人</label><select id="chore-assignee" name="assignee">' + state.members.map(function (person) { return '<option value="' + person.id + '">' + person.name + "</option>"; }).join("") + '</select></div>'
      + '<div><label class="field-label" for="chore-date">日期</label><input id="chore-date" name="date" type="date" required value="' + isoDate(1) + '"></div><div class="full"><label class="field-label" for="chore-points">积分</label><select id="chore-points" name="points"><option value="5">5分 · 简单</option><option value="10" selected>10分 · 普通</option><option value="20">20分 · 深度清洁</option></select></div></div>'
      + '<div class="modal-actions"><button class="secondary-button" type="button" data-action="close-modal">取消</button><button class="primary-button" type="submit">安排任务</button></div></form>');
  }

  function openShoppingModal() {
    openModal("共享清单", "添加采购物品", '<form id="shopping-form"><label class="field-label" for="shopping-name">物品名称</label><input id="shopping-name" name="name" required placeholder="例如：厨房纸">'
      + '<div class="form-grid"><div><label class="field-label" for="shopping-category">分类</label><select id="shopping-category" name="category"><option>日用品</option><option>清洁</option><option>食品</option><option>维修</option></select></div>'
      + '<div><label class="field-label" for="shopping-estimate">预计价格</label><input id="shopping-estimate" name="estimate" type="number" min="0" step="0.01" value="20"></div></div>'
      + '<div class="modal-actions"><button class="secondary-button" type="button" data-action="close-modal">取消</button><button class="primary-button" type="submit">加入清单</button></div></form>');
  }

  function openRepairModal() {
    openModal("房屋管理", "新增报修", '<form id="repair-form"><label class="field-label" for="repair-title">问题描述</label><input id="repair-title" name="title" required placeholder="例如：卫生间灯具损坏">'
      + '<label class="field-label" for="repair-note">补充说明</label><textarea id="repair-note" name="note" placeholder="位置、发现时间等信息"></textarea>'
      + '<div class="modal-actions"><button class="secondary-button" type="button" data-action="close-modal">取消</button><button class="primary-button" type="submit">提交报修</button></div></form>');
  }

  function openMessages() {
    var html = '<div class="message-list">' + state.messages.map(function (item) {
      return '<div class="message-item ' + (!item.read ? "unread" : "") + '"><div class="list-icon">' + item.icon + '</div><div><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.body) + " · " + item.time + "</small></div></div>";
    }).join("") + '</div><div class="modal-actions"><button class="secondary-button" data-action="mark-read">全部已读</button><button class="primary-button" data-action="close-modal">知道了</button></div>';
    openModal("通知中心", "房间消息", html);
  }

  function openRoomInfo() {
    openModal("当前房间", state.room.name + " " + state.room.code, '<div class="list"><div class="list-row"><div class="list-icon">址</div><div class="list-content"><strong>房屋地址</strong><small>' + escapeHtml(state.room.address)
      + '</small></div></div><div class="list-row"><div class="list-icon">租</div><div class="list-content"><strong>房租缴纳日</strong><small>每月' + state.room.rentDueDay + '日</small></div></div><div class="list-row"><div class="list-icon">约</div><div class="list-content"><strong>租约到期</strong><small>' + state.room.leaseEnd + '</small></div></div></div>');
  }

  function openUtilityModal(id) {
    var item = state.utilities.find(function (x) { return x.id === id; });
    if (!item) return;
    openModal("公共抄表", "更新" + item.name, '<form id="utility-form"><input type="hidden" name="id" value="' + item.id + '"><label class="field-label" for="utility-reading">当前读数（' + item.unit + '）</label><input id="utility-reading" name="reading" type="number" step="0.1" min="0" required value="' + item.reading + '"><div class="modal-actions"><button class="secondary-button" type="button" data-action="close-modal">取消</button><button class="primary-button" type="submit">保存读数</button></div></form>');
  }

  function changeTab(tab) {
    activeTab = tab;
    renderPage();
  }

  document.addEventListener("click", function (event) {
    var target = event.target.closest("[data-tab], [data-action]");
    if (!target) return;
    if (target.dataset.tab) {
      changeTab(target.dataset.tab);
      return;
    }
    var action = target.dataset.action;
    var id = Number(target.dataset.id);
    if (action === "close-modal") closeModal();
    if (action === "add-bill") openBillModal();
    if (action === "add-chore") openChoreModal();
    if (action === "add-shopping") openShoppingModal();
    if (action === "add-repair") openRepairModal();
    if (action === "messages") openMessages();
    if (action === "room-info") openRoomInfo();
    if (action === "bill-filter") { billFilter = target.dataset.filter; renderPage(); }
    if (action === "toggle-chore") {
      var chore = state.chores.find(function (x) { return x.id === id; });
      if (chore) {
        var wasDone = chore.status === "completed";
        chore.status = wasDone ? "pending" : "completed";
        var assignee = member(chore.assignee);
        assignee.points += wasDone ? -chore.points : chore.points;
        assignee.choresDone += wasDone ? -1 : 1;
        saveState(); renderPage(); showToast(wasDone ? "任务已恢复" : "家务完成，积分已更新");
      }
    }
    if (action === "rotate-chores") {
      var ids = state.members.map(function (x) { return x.id; });
      state.chores.filter(function (x) { return x.status !== "completed"; }).forEach(function (chore) {
        chore.assignee = ids[(ids.indexOf(chore.assignee) + 1) % ids.length];
        var date = new Date(chore.date + "T00:00:00"); date.setDate(date.getDate() + 7); chore.date = localDateString(date);
      });
      saveState(); renderPage(); showToast("已生成下周轮班");
    }
    if (action === "toggle-shopping") {
      var item = state.shopping.find(function (x) { return x.id === id; });
      if (item && item.status !== "billed") { item.status = item.status === "pending" ? "purchased" : "pending"; saveState(); renderPage(); }
    }
    if (action === "delete-shopping") {
      state.shopping = state.shopping.filter(function (x) { return x.id !== id; }); saveState(); renderPage(); showToast("已从清单删除");
    }
    if (action === "shopping-to-bill") {
      var bought = state.shopping.find(function (x) { return x.id === id; });
      if (bought) {
        state.bills.unshift({ id: Date.now(), title: bought.name, category: "grocery", amount: Number(bought.estimate), payer: state.currentUserId, participants: state.members.map(function (x) { return x.id; }), date: isoDate(0), status: "pending" });
        bought.status = "billed"; saveState(); renderPage(); showToast("已转为AA账单");
      }
    }
    if (action === "settle-all") {
      state.bills.forEach(function (bill) { if (bill.status === "pending") bill.status = "settled"; });
      saveState(); renderPage(); showToast("所有待结账单已标记为结清");
    }
    if (action === "mark-read") {
      state.messages.forEach(function (x) { x.read = true; }); saveState(); closeModal(); renderPage(); showToast("消息已全部读完");
    }
    if (action === "update-utility") openUtilityModal(target.dataset.id);
    if (action === "invite") {
      navigator.clipboard && navigator.clipboard.writeText(state.room.code);
      showToast("邀请码 " + state.room.code + " 已复制");
    }
    if (action === "reset-demo") {
      state = freshState(); saveState(); renderPage(); showToast("示例数据已恢复");
    }
    if (action === "logout") {
      localStorage.removeItem(SESSION_KEY);
      document.getElementById("app-shell").classList.add("is-hidden");
      document.getElementById("login-screen").classList.remove("is-hidden");
      showToast("已退出登录");
    }
  });

  document.addEventListener("submit", function (event) {
    event.preventDefault();
    var form = event.target;
    var data = new FormData(form);
    if (form.id === "login-form") {
      var phone = String(data.get("phone") || "").replace(/\D/g, "");
      var code = String(data.get("roomCode") || "").trim();
      document.getElementById("phone-error").textContent = phone.length === 11 ? "" : "请输入11位手机号";
      document.getElementById("code-error").textContent = code ? "" : "请输入房间邀请码";
      if (phone.length !== 11 || !code) return;
      enterApp();
    }
    if (form.id === "bill-form") {
      var participants = data.getAll("participants");
      if (!participants.length) { showToast("请至少选择一位分摊成员"); return; }
      state.bills.unshift({ id: Date.now(), title: String(data.get("title")), category: String(data.get("category")), amount: Number(data.get("amount")), payer: String(data.get("payer")), participants: participants, date: isoDate(0), status: "pending" });
      saveState(); closeModal(); changeTab("bills"); showToast("账单已添加并重新计算结算方案");
    }
    if (form.id === "chore-form") {
      state.chores.push({ id: Date.now(), title: String(data.get("title")), assignee: String(data.get("assignee")), date: String(data.get("date")), points: Number(data.get("points")), status: "pending" });
      saveState(); closeModal(); changeTab("chores"); showToast("家务已安排");
    }
    if (form.id === "shopping-form") {
      state.shopping.unshift({ id: Date.now(), name: String(data.get("name")), category: String(data.get("category")), requester: state.currentUserId, estimate: Number(data.get("estimate")), status: "pending" });
      saveState(); closeModal(); changeTab("shopping"); showToast("已加入共享清单");
    }
    if (form.id === "repair-form") {
      state.repairs.unshift({ id: Date.now(), title: String(data.get("title")), creator: state.currentUserId, date: isoDate(0), status: "待处理" });
      saveState(); closeModal(); changeTab("profile"); showToast("报修已提交");
    }
    if (form.id === "utility-form") {
      var utility = state.utilities.find(function (x) { return x.id === data.get("id"); });
      if (utility) { utility.reading = String(data.get("reading")); utility.updated = isoDate(0); }
      saveState(); closeModal(); renderPage(); showToast("抄表读数已更新");
    }
  });

  document.getElementById("demo-login").addEventListener("click", enterApp);
  document.getElementById("modal-backdrop").addEventListener("click", function (event) {
    if (event.target.id === "modal-backdrop") closeModal();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeModal();
  });

  function enterApp() {
    localStorage.setItem(SESSION_KEY, "active");
    document.getElementById("login-screen").classList.add("is-hidden");
    document.getElementById("app-shell").classList.remove("is-hidden");
    activeTab = "home";
    renderPage();
    showToast("欢迎回到阳光花园 A-1902");
  }

  if (localStorage.getItem(SESSION_KEY) === "active" || new URLSearchParams(window.location.search).get("preview") === "app") {
    enterApp();
  }
})();

