var mobileAppInterface = (cb) => {
    try {
      if (AndroidApp) {
        window.mobileApp = AndroidApp;
        window.isAndroidApp = true;
        window.isHybridView = true;
        window.mobile = {
          dispatchEvent: (eventName, data) => {
            let returnData = data;
            try {
              returnData = JSON.parse(data);
            } catch (e) {
              returnData = data;
            }
            const event = new CustomEvent("_mobileEvent", {
              detail: { id: eventName, data: returnData },
            });
            document.dispatchEvent(event);
          },
        };
        return cb(AndroidApp);
      }
    } catch (e) {
      window.goHome = () => {
        window.location.href = "/";
      };
      window.isAndroidApp = false;
      window.isHybridView = false;
    }
    try {
      if (typeof window.webkit !== "undefined") {
        window.mobileApp = window.webkit.messageHandlers;
        window.isIOSView = true;
        window.isHybridView = true;
        window.mobile = {
          dispatchEvent: (eventName, data) => {
            let returnData = data;
            try {
              returnData = JSON.parse(data);
            } catch (e) {
              returnData = data;
            }
            const event = new CustomEvent("_mobileEvent", {
              detail: { id: eventName, data: returnData },
            });
            document.dispatchEvent(event);
          },
        };
        window.closeHybridView = () => {
          window.webkit.messageHandlers.exitCall.postMessage("exit");
        };
        window.webkit.messageHandlers.webLoadingCompleted.postMessage(
          "loading completed"
        );
        return cb(window.webkit.messageHandlers);
      }
    } catch (e) {
      window.goHome = () => {
        window.location.href = "/";
      };
      window.isAndroidApp = false;
      window.isHybridView = false;
      window.isIOSView = false;
    }
    return cb(false);
  };
  
  function isIOS(fxName) {
    let isChrome = null;
    if (typeof window !== "undefined") {
      isChrome = window?.navigator?.userAgent.match("CriOS")?.length;
    }
    const isAppleDevice =
      typeof window !== "undefined" &&
      typeof window.webkit !== "undefined" &&
      typeof window.webkit.messageHandlers !== "undefined" &&
      !isChrome;
    return isAppleDevice && fxName
      ? typeof window.webkit.messageHandlers[fxName] === "object" &&
          typeof window.webkit.messageHandlers[fxName].postMessage === "function"
      : isAppleDevice;
  }
  
  function isAndroid(fxName = false) {
    const isAndroidDevice =
      typeof window !== "undefined" && typeof window.AndroidApp !== "undefined";
    return isAndroidDevice && fxName
      ? typeof window.AndroidApp[fxName] === "function"
      : isAndroidDevice;
  }
  
  mobileAppInterface((mobileApp) => {
    try {
      if (window.AndroidApp) {
        mobileApp.showLoader(false);
        if (typeof mobileApp.toggleCaching === "function") {
          mobileApp.toggleCaching("default");
        }
      }
    } catch (e) {
      // console.log('error androidApp', e);
    }
  });
  
  var fetchLocation = (cb) => {
    let locationFetched = false;
    try {
      if (window.AndroidApp) {
        if (typeof window.AndroidApp.askForLocationPermission === "function") {
          setTimeout(() => {
            window.AndroidApp.askForLocationPermission();
          }, 1000);
        }
        document.addEventListener("_mobileEvent", (e) => {
          if (e.detail.data === "granted" && !locationFetched) {
            window.AndroidApp.fetchLocation(false, 4000);
          }
          if (e.detail.data?.latitude) {
            locationFetched = true;
          }
          cb(e.detail.data?.latitude ? e.detail.data : "denied");
        });
      } else {
        getgeocord(cb);
      }
    } catch (e) {
      // console.log('error androidApp', e);
    }
  };
  
  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error)
      );
    });
  }
  const getgeocord = (cb) => {
    getCurrentPosition()
      .then((position) => {
        cb(position);
      })
      .catch((error) => {
        if (error) {
          cb(error);
        }
      });
  };
  
  // for back handler
  
  function closeHybridView() {
    try {
      if (isIOS("exitCall")) {
        window.webkit.messageHandlers.exitCall.postMessage("exit");
      } else if (window.AndroidApp) {
        window.AndroidApp.closeActivity();
      } else {
        typeof window !== "undefined" &&
          window.open("https://www.nobroker.in/instacash", "_self");
      }
    } catch (error) {
      console.error(error);
    }
  }
  
  const backHandler = (event) => {
    const eventId = event?.detail?.id;
    switch (eventId) {
      case "back":
        event.preventDefault();
        closeHybridView();
        break;
      default:
        break;
    }
  };
  function handleBack(cb) {
    if (window.AndroidApp) {
      document.addEventListener("_mobileEvent", (e) => cb(e?.detail?.id));
    }
  }
  
  // for camera Permissions
  function checkCamera(cb) {
    if (window.AndroidApp) {
      setTimeout(() => {
        window.AndroidApp.askForCameraPermission();
      }, 1000);
      document.addEventListener("_mobileEvent", (value) => {
        if (value?.detail?.id === "permissionEvent") {
          if (value?.detail?.data === "denied") {
            window.AndroidApp.showToast(
              "red",
              "Error accessing the camera, Please allow camera permissions.",
              30000
            );
            //write error here
          }
          cb(value?.detail?.data);
        }
      });
    } else {
      checkCameraPermission(cb);
    }
  }
  
  const iOSCameraPermission = () => {
    try {
      if (isIOS("iOSAskPermissionIfDenied")) {
        window.webkit.messageHandlers.iOSAskPermissionIfDenied.postMessage(
          "Camera"
        );
      }
    } catch (e) {
      console.log(e);
    }
  };
  
  const checkCameraPermission = async (cb) => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      cb("granted");
    } catch (error) {
      if (isIOS("iOSAskPermissionIfDenied")) {
        iOSCameraPermission();
      }
      window.AndroidApp.showToast(
        "red",
        "Error accessing the camera, Please allow camera permissions.",
        30000
      );
      //write error
    }
  };
  
  