const RAZORPAY_CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const LOAD_TIMEOUT_MS = 12000;

export const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    let timeoutId;
    const clearLoadTimeout = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };

    timeoutId = window.setTimeout(() => {
      reject(new Error("Razorpay script load timed out. Please check internet or allow checkout.razorpay.com."));
    }, LOAD_TIMEOUT_MS);

    if (window.Razorpay) {
      clearLoadTimeout();
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_URL}"]`);

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => {
          clearLoadTimeout();
          resolve(true);
        },
        { once: true }
      );
      existingScript.addEventListener(
        "error",
        () => {
          clearLoadTimeout();
          reject(new Error("Unable to load Razorpay."));
        },
        {
          once: true,
        }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_URL;
    script.async = true;
    script.onload = () => {
      clearLoadTimeout();
      resolve(true);
    };
    script.onerror = () => {
      clearLoadTimeout();
      reject(new Error("Unable to load Razorpay."));
    };
    document.body.appendChild(script);
  });
