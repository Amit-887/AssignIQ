// Google OAuth configuration
export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id-here';

// Load Google OAuth script
export const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.google && window.google.accounts) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Initialize Google OAuth
export const initializeGoogleAuth = (callback) => {
  if (!window.google || !window.google.accounts) {
    console.error('Google OAuth not loaded');
    return;
  }

  // Prevent multiple initializations
  if (window.__googleAuthInitialized) {
    console.log('Google Auth already initialized, skipping...');
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: callback,
    auto_select: false,
    cancel_on_tap_outside: true,
    // Enable FedCM for better browser compatibility
    use_fedcm_for_prompt: true,
    // Use prompt mode for direct account selection
    ux_mode: 'popup',
    // Enable native One Tap for better UX
    itp_support: true,
    // Configure prompt behavior
    prompt_parent_id: 'google-signin-button'
  });

  window.__googleAuthInitialized = true;
};

// Render Google Sign-In button
export const renderGoogleButton = (buttonId, theme = 'outline', size = 'large') => {
  if (!window.google || !window.google.accounts) {
    console.error('Google OAuth not loaded');
    return;
  }

  window.google.accounts.id.renderButton(
    document.getElementById(buttonId),
    {
      theme: theme,
      size: size,
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: '100%'
    }
  );
};

// Sign in with popup (using One Tap)
export const signInWithGoogle = () => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.accounts) {
      reject(new Error('Google OAuth not loaded'));
      return;
    }

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        reject(new Error('Google sign-in was not displayed'));
      } else {
        resolve(notification);
      }
    });
  });
};
