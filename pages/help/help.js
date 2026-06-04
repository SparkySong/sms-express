import Toast from '@vant/weapp/toast/toast';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    activeTab: 'faq',          // 当前激活的标签页: faq / feedback
    activeNames: ['1'],        // 展开的折叠面板
    showTypeOptions: false,    // 是否显示反馈类型选择弹窗
    feedback: {
      type: '',                // 反馈类型
      content: '',             // 反馈内容
      contact: ''              // 联系方式
    },
    feedbackTypes: [           // 反馈类型列表
      { id: 1, name: '功能建议' },
      { id: 2, name: '内容问题' },
      { id: 3, name: '操作问题' },
      { id: 4, name: 'Bug反馈' },
      { id: 5, name: '其他问题' }
    ]
  },

  /**
   * 切换标签页
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
  },
  
  /**
   * 折叠面板状态变化
   */
  onCollapseChange(event) {
    this.setData({
      activeNames: event.detail
    });
  },
  
  /**
   * 从常见问题切换到反馈
   */
  switchToFeedback() {
    this.setData({
      activeTab: 'feedback'
    });
  },
  
  /**
   * 复制文本
   */
  copyText(e) {
    const text = e.currentTarget.dataset.text;
    wx.setClipboardData({
      data: text,
      success: () => {
        Toast('复制成功11');
      }
    });
  },
  
  /**
   * 显示反馈类型弹窗
   */
  showTypePopup() {
    this.setData({
      showTypeOptions: true
    });
  },
  
  /**
   * 隐藏反馈类型弹窗
   */
  hideTypePopup() {
    this.setData({
      showTypeOptions: false
    });
  },
  
  /**
   * 选择反馈类型
   */
  selectFeedbackType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'feedback.type': type,
      showTypeOptions: false
    });
  },
  
  /**
   * 反馈内容变化
   */
  onContentChange(e) {
    this.setData({
      'feedback.content': e.detail
    });
  },
  
  /**
   * 联系方式变化
   */
  onContactChange(e) {
    this.setData({
      'feedback.contact': e.detail
    });
  },
  
  /**
   * 提交反馈
   */
  submitFeedback() {
    const { type, content, contact } = this.data.feedback;
    
    // 验证
    if (!type) {
      Toast('请选择反馈类型');
      return;
    }
    
    if (!content || content.trim().length < 5) {
      Toast('请输入至少5个字的反馈内容');
      return;
    }
    
    // 显示加载中
    Toast.loading({
      message: '提交中...',
      forbidClick: true,
      duration: 0
    });
    
    // 模拟提交过程
    setTimeout(() => {
      Toast.clear();
      
      // 提交成功
      Toast.success('反馈提交成功');
      
      // 重置表单
      this.setData({
        feedback: {
          type: '',
          content: '',
          contact: ''
        }
      });
      
      // 2秒后返回FAQ页面
      setTimeout(() => {
        this.setData({
          activeTab: 'faq'
        });
      }, 2000);
    }, 1500);
  }
}) 