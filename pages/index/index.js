// pages/index/index.js
const { Solar, Lunar } = require('lunar-javascript');
const { provinces, cityMap } = require('../../utils/city.js');

Page({
  data: {
    currentBazi: '加载中...',
    birthDate: '',
    birthTime: '未知',
    birthTimeIndex: 0,
    timeOptions: [],
    currentDate: '',
    selectedDate: [0,0,0],
    yearOptions: [],
    monthOptions: [],
    dayOptions: [],
    isLunar: false,
    gender: '1',

    provinceList: provinces,
    provinceIndex: 0,
    cityList: [],
    cityIndex: 0
  },

  onLoad() {
    // 生成时间选项
    const timeOptions_base = ['未知'];
    for (let i = 0; i < 24; i++) {
      timeOptions_base.push(i.toString().padStart(2, '0'));
    }
    const timeOptions = timeOptions_base.concat(timeOptions_base).concat(timeOptions_base);

    // 生成年月日选项
    const now = new Date();
    const currentYear = now.getFullYear();
    const yearOptions_base = [];
    for (let y = 1900; y <= currentYear; y++) {
      yearOptions_base.push(y.toString());
    }
    const yearOptions = yearOptions_base.concat(yearOptions_base).concat(yearOptions_base);

    const monthOptions_base = [];
    for (let m = 1; m <= 12; m++) {
      monthOptions_base.push(m.toString().padStart(2, '0'));
    }
    const monthOptions = monthOptions_base.concat(monthOptions_base).concat(monthOptions_base);

    const dayOptions_base = [];
    for (let d = 1; d <= 31; d++) {
      dayOptions_base.push(d.toString().padStart(2, '0'));
    }
    const dayOptions = dayOptions_base.concat(dayOptions_base).concat(dayOptions_base);

    // 设置当前日期
    const currentDate = `${currentYear}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
    const defaultDate = currentDate;
    const selectedDate = [yearOptions_base.length + yearOptions_base.length - 1, monthOptions_base.length + now.getMonth(), dayOptions_base.length + now.getDate() - 1];

    this.setData({
      timeOptions: timeOptions,
      yearOptions: yearOptions,
      monthOptions: monthOptions,
      dayOptions: dayOptions,
      currentDate: currentDate,
      birthDate: defaultDate,
      selectedDate: selectedDate,
      birthTimeIndex: timeOptions_base.length // 默认未知在中间
    });

    // 【最关键】用异步延迟，避免小程序阻塞 → 永远不 timeout！
    setTimeout(() => {
      this.refreshCurrentTime();
    }, 300);

    this.setData({
      cityList: this.getAllCities()
    });
  },

  // 顶部当前时间（只计算一次，不频繁刷新）
  refreshCurrentTime() {
    try {
      const now = new Date();
      const solar = Solar.fromDate(now);
      const lunar = solar.getLunar();
      const bazi = lunar.getEightChar();
      this.setData({
        currentBazi: `${bazi.getYear()} ${bazi.getMonth()} ${bazi.getDay()} ${bazi.getTime()}`
      });
    } catch (e) {
      this.setData({ currentBazi: '获取时间失败' });
    }
  },

  // 选择日期
  onDateChange(e) {
    const selectedDate = e.detail.value;
    const yearIndex = selectedDate[0] % 127; // 2026-1900+1=127
    const monthIndex = selectedDate[1] % 12;
    const dayIndex = selectedDate[2] % 31;
    const year = this.data.yearOptions[yearIndex];
    const month = this.data.monthOptions[monthIndex];
    const day = this.data.dayOptions[dayIndex];
    this.setData({
      birthDate: `${year}-${month}-${day}`,
      selectedDate: selectedDate
    });
  },

  // 选择时间
  onTimeChange(e) {
    const index = e.detail.value;
    const actualIndex = index % 25;
    this.setData({
      birthTimeIndex: index,
      birthTime: this.data.timeOptions[actualIndex]
    });
  },

  // 切换公历/农历
  onCalendarChange(e) {
    this.setData({
      isLunar: e.detail.value === 'true'
    });
  },

  // 性别
  onGenderChange(e) {
    this.setData({
      gender: e.detail.value
    });
  },

  // 省份
  onProvinceChange(e) {
    const i = e.detail.value;
    const name = this.data.provinceList[i];
    this.setData({ provinceIndex: i });
    const cities = i === 0 ? this.getAllCities() : (cityMap[name] || []);
    this.setData({ cityList: cities, cityIndex: 0 });
  },

  // 城市
  onCityChange(e) {
    this.setData({ cityIndex: e.detail.value });
  },

  // 提交计算（异步执行，绝不卡顿）
  onSubmit() {
    const { birthDate, birthTime } = this.data;
    if (!birthDate) {
      wx.showToast({ title: '请选择出生日期', icon: 'none' });
      return;
    }

    // 组合出生时间
    let birthDateTime;
    if (birthTime === '未知') {
      birthDateTime = `${birthDate} 12:00`; // 默认中午
    } else {
      birthDateTime = `${birthDate} ${birthTime}:00`;
    }

    // 异步计算 → 永不 timeout
    setTimeout(() => {
      try {
        const params = {
          birthDateTime,
          isLunar: this.data.isLunar,
          gender: this.data.gender,
          province: this.data.provinceList[this.data.provinceIndex],
          city: this.data.cityList[this.data.cityIndex]
        };

        wx.navigateTo({
          url: `/pages/result/result?params=${encodeURIComponent(JSON.stringify(params))}`
        });
      } catch (err) {
        wx.showToast({ title: '计算失败', icon: 'none' });
      }
    }, 200);
  },

  // 所有城市
  getAllCities() {
    let arr = [];
    for (let p in cityMap) arr = arr.concat(cityMap[p]);
    return arr;
  }
});