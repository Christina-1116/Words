module.exports = {
  get(k, d) { try { const v = wx.getStorageSync('hz:' + k); return v === '' || v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { wx.setStorageSync('hz:' + k, v); } catch (e) {} }
};
