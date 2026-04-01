// pages/result/result.js
const { Solar, Lunar } = require('lunar-javascript');

Page({
  data: {
    baziResult: '',
    userInputBazi: '',
    characterTags: [],
    wuxingAdvice: [],
    wuxingData: {} // 五行数据，用于绘制图表
  },

  onLoad: function(options) {
    const params = JSON.parse(decodeURIComponent(options.params));
    this.calculateBazi(params);
  },

  calculateBazi: function(params) {
    try {
      // 显示用户输入
      const timeStr = params.birthTime === '未知' ? '时辰未知' : `${params.birthTime}时`;
      const calendarStr = params.isLunar ? '农历' : '公历';
      const userInput = `${params.birthDate} ${timeStr} ${calendarStr}`;
      this.setData({ userInputBazi: userInput });

      let solar, lunar;
      if (params.isLunar) {
        // 如果是农历，创建 Lunar 对象
        const date = new Date(params.birthDateTime);
        lunar = Lunar.fromDate(date);
        solar = lunar.getSolar();
      } else {
        // 公历
        const date = new Date(params.birthDateTime);
        solar = Solar.fromDate(date);
        lunar = solar.getLunar();
      }
      const bazi = lunar.getEightChar();
      const baziStr = `${bazi.getYear()}年 ${bazi.getMonth()}月 ${bazi.getDay()}日 ${bazi.getTime()}时`;

      // 计算五行
      const wuxing = this.calculateWuxing(bazi);
      // 生成标签和建议
      const tags = this.generateTags(bazi, params.gender);
      const advice = this.generateAdvice(wuxing);

      this.setData({
        baziResult: baziStr,
        characterTags: tags,
        wuxingAdvice: advice,
        wuxingData: wuxing
      });
      this.drawWuxingChart(wuxing);
    } catch (err) {
      console.error('计算失败', err);
      wx.showToast({
        title: '计算失败，请重试',
        icon: 'none'
      });
    }
  },

  drawWuxingChart: function(wuxingData) {
    // 使用 canvas 绘制五行环形图
    const ctx = wx.createCanvasContext('wuxingChart');
    const centerX = 150;
    const centerY = 100;
    const radius = 60;
    const colors = {
      金: '#FFD700',
      木: '#228B22',
      水: '#1E90FF',
      火: '#DC143C',
      土: '#D2691E'
    };

    let startAngle = -Math.PI / 2;
    Object.keys(wuxingData).forEach(key => {
      const percentage = wuxingData[key] / 100;
      const angle = percentage * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
      ctx.lineTo(centerX, centerY);
      ctx.setFillStyle(colors[key]);
      ctx.fill();
      startAngle += angle;
    });

    // 添加标签
    let labelAngle = -Math.PI / 2;
    Object.keys(wuxingData).forEach(key => {
      const percentage = wuxingData[key] / 100;
      const angle = percentage * 2 * Math.PI;
      const labelX = centerX + (radius + 20) * Math.cos(labelAngle + angle / 2);
      const labelY = centerY + (radius + 20) * Math.sin(labelAngle + angle / 2);
      ctx.setFontSize(12);
      ctx.setFillStyle('#333');
      ctx.fillText(`${key}: ${wuxingData[key]}%`, labelX - 20, labelY);
      labelAngle += angle;
    });

    ctx.draw();
  },

  goBack: function() {
    wx.navigateBack();
  },

  // 计算五行
  calculateWuxing: function(bazi) {
    const ganZhi = [
      bazi.getYearGan() + bazi.getYearZhi(),
      bazi.getMonthGan() + bazi.getMonthZhi(),
      bazi.getDayGan() + bazi.getDayZhi(),
      bazi.getTimeGan() + bazi.getTimeZhi()
    ];

    const wuxingMap = {
      '金': ['庚', '辛', '申', '酉'],
      '木': ['甲', '乙', '寅', '卯'],
      '水': ['壬', '癸', '亥', '子'],
      '火': ['丙', '丁', '巳', '午'],
      '土': ['戊', '己', '辰', '戌', '丑', '未']
    };

    let counts = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };

    ganZhi.forEach(gz => {
      for (let w in wuxingMap) {
        if (wuxingMap[w].some(c => gz.includes(c))) {
          counts[w]++;
        }
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    let percentages = {};
    for (let w in counts) {
      percentages[w] = Math.round((counts[w] / total) * 100);
    }
    return percentages;
  },

  // 生成性格标签
  generateTags: function(bazi, gender) {
    // 简化逻辑，基于日干生成标签
    const dayGan = bazi.getDayGan();
    const tagsMap = {
      '甲': ['有领导力', '独立', '有毅力'],
      '乙': ['细腻', '有耐心', '聪明'],
      '丙': ['热情', '有创造力', '自信'],
      '丁': ['温柔', '有爱心', '细心'],
      '戊': ['稳重', '可靠', '有责任心'],
      '己': ['务实', '勤奋', '有条理'],
      '庚': ['刚强', '有正义感', '勇敢'],
      '辛': ['精明', '有洞察力', '独立'],
      '壬': ['智慧', '有远见', '灵活'],
      '癸': ['敏感', '有同情心', '适应力强']
    };
    return tagsMap[dayGan] || ['稳重', '聪明', '有耐心'];
  },

  // 生成五行建议
  generateAdvice: function(wuxing) {
    const maxWuxing = Object.keys(wuxing).reduce((a, b) => wuxing[a] > wuxing[b] ? a : b);
    const adviceMap = {
      '金': ['适合多接触金属性事物', '颜色适合白色、金色', '方向喜西方'],
      '木': ['适合多接触木属性事物', '颜色适合绿色', '方向喜东方'],
      '水': ['适合多接触水属性事物', '颜色适合蓝色、黑色', '方向喜北方'],
      '火': ['适合多接触火属性事物', '颜色适合红色', '方向喜南方'],
      '土': ['适合多接触土属性事物', '颜色适合黄色、棕色', '方向喜中央']
    };
    return adviceMap[maxWuxing] || ['保持平衡'];
  },

  // 返回首页
  goBack() {
    wx.navigateBack();
  },
});