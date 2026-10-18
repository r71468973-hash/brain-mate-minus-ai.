export interface AndroidIntentResult {
  success: boolean;
  message: string;
  schemeTriggered?: string;
  isNativeIntent?: boolean;
}

export const AndroidIntentService = {
  // Trigger native Android share menu
  async shareNative(title: string, text: string, url?: string): Promise<AndroidIntentResult> {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: url || window.location.href,
        });
        return { success: true, message: 'Content shared successfully through Android share menu.', isNativeIntent: true };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return { success: false, message: 'Share action was cancelled.' };
        }
        console.warn('Native share error:', err);
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${title}\n${text}`);
      return { success: true, message: 'Copied to clipboard! You can paste it into any Android app.' };
    } catch {
      return { success: false, message: 'Could not trigger native share or copy to clipboard.' };
    }
  },

  // Open WhatsApp with recipient and message
  openWhatsApp(phone?: string, text?: string): AndroidIntentResult {
    let url = '';
    const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : '';
    const encodedText = encodeURIComponent(text || 'Hello from Brain Mate');

    if (cleanPhone) {
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    } else {
      url = `whatsapp://send?text=${encodedText}`;
    }

    try {
      window.location.href = url;
      return {
        success: true,
        message: cleanPhone
          ? `Opening WhatsApp chat with ${cleanPhone}...`
          : 'Launching WhatsApp composer...',
        schemeTriggered: url,
        isNativeIntent: true,
      };
    } catch (e: any) {
      return { success: false, message: 'Failed to launch WhatsApp: ' + e.message };
    }
  },

  // Open Phone Dialer
  openDialer(phone: string): AndroidIntentResult {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanPhone}`;
    try {
      window.location.href = url;
      return { success: true, message: `Opening Phone Dialer for ${phone || 'contact'}...`, schemeTriggered: url, isNativeIntent: true };
    } catch (e: any) {
      return { success: false, message: 'Could not open phone dialer: ' + e.message };
    }
  },

  // Open SMS
  openSms(phone?: string, body?: string): AndroidIntentResult {
    const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : '';
    const encodedBody = encodeURIComponent(body || '');
    const url = `sms:${cleanPhone}?body=${encodedBody}`;
    try {
      window.location.href = url;
      return { success: true, message: 'Opening SMS Messaging app...', schemeTriggered: url, isNativeIntent: true };
    } catch (e: any) {
      return { success: false, message: 'Could not open SMS: ' + e.message };
    }
  },

  // Open Calculator
  openCalculator(): AndroidIntentResult {
    try {
      // Android intent URI for native calculator
      window.location.href = 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALCULATOR;end';
      return { success: true, message: 'Launching Android Calculator app...', isNativeIntent: true };
    } catch {
      window.open('https://www.google.com/search?q=calculator', '_blank');
      return { success: true, message: 'Opening Calculator in browser.' };
    }
  },

  // Open YouTube
  openYouTube(query?: string): AndroidIntentResult {
    const url = query
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
      : 'https://www.youtube.com';
    try {
      window.open(url, '_blank');
      return { success: true, message: `Opening YouTube ${query ? `for "${query}"` : ''}...`, schemeTriggered: url, isNativeIntent: true };
    } catch (e: any) {
      return { success: false, message: 'Could not open YouTube: ' + e.message };
    }
  },

  // Open Google Maps
  openMaps(query: string): AndroidIntentResult {
    const encoded = encodeURIComponent(query || 'current location');
    const url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    try {
      window.open(url, '_blank');
      return { success: true, message: `Opening Google Maps for "${query}"...`, schemeTriggered: url, isNativeIntent: true };
    } catch (e: any) {
      return { success: false, message: 'Could not open Maps: ' + e.message };
    }
  },

  // Open Camera
  openCamera(): AndroidIntentResult {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.click();
      return { success: true, message: 'Triggered Android Camera capture interface.', isNativeIntent: true };
    } catch (e: any) {
      return { success: false, message: 'Could not trigger camera: ' + e.message };
    }
  },

  // Open News
  openNews(query?: string): AndroidIntentResult {
    const url = query
      ? `https://news.google.com/search?q=${encodeURIComponent(query)}`
      : 'https://news.google.com';
    try {
      window.open(url, '_blank');
      return { success: true, message: 'Opening top latest news...', schemeTriggered: url };
    } catch (e: any) {
      return { success: false, message: 'Could not open news: ' + e.message };
    }
  },

  // Search Web
  searchWeb(query: string): AndroidIntentResult {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    try {
      window.open(url, '_blank');
      return { success: true, message: `Searching Google for "${query}"...`, schemeTriggered: url };
    } catch (e: any) {
      return { success: false, message: 'Could not open search: ' + e.message };
    }
  },

  // Open Android Settings
  openAndroidSettings(): AndroidIntentResult {
    try {
      window.location.href = 'intent:#Intent;action=android.settings.SETTINGS;end';
      return { success: true, message: 'Attempting to open Android System Settings...', isNativeIntent: true };
    } catch {
      return { success: false, message: 'Swipe down on your phone and tap the gear icon for Settings.' };
    }
  },
};
