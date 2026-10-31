if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {
    // 無法註冊時 App 仍可連線使用，只是沒有離線功能
  });
}
