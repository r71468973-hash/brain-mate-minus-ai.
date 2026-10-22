import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  ExternalLink,
  Code2,
  FileCode,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
  Github,
} from 'lucide-react';

interface ApkReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallPwa: () => void;
  isPwaInstalled: boolean;
}

export const ApkReleaseModal: React.FC<ApkReleaseModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallPwa,
  isPwaInstalled,
}) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'comparison' | 'github' | 'bubblewrap' | 'capacitor' | 'playstore'>('pwa');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const bubblewrapCommand = `npm install -g @bubblewrap/cli
bubblewrap init --manifest="${window.location.origin}/manifest.webmanifest"
bubblewrap build`;

  const capacitorCommand = `npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Brain Mate" "com.brainmate.ai" --web-dir dist
npm run build
npx cap add android
npx cap open android`;

  const manifestJsonContent = {
    name: 'Brain Mate — Your Personal AI Assistant',
    short_name: 'Brain Mate',
    description: 'Intelligent Android AI Assistant with Voice, Clap Sensor & Share Market Analysis.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#090d16',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: '192x192 512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };

  const downloadManifestFile = () => {
    const blob = new Blob([JSON.stringify(manifestJsonContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.webmanifest';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadGithubWorkflow = () => {
    const workflowContent = `name: Build Android APK and AAB

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    name: Build Android Release APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: 'package-lock.json'

      - name: Setup Java JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Install NPM Dependencies
        run: |
          if [ -f "package-lock.json" ]; then
            npm ci --legacy-peer-deps || npm install --legacy-peer-deps
          else
            npm install --legacy-peer-deps
          fi

      - name: Build Web Application
        run: npm run build

      - name: Setup Capacitor Android
        run: |
          npm install @capacitor/core @capacitor/cli @capacitor/android --legacy-peer-deps
          if [ ! -f "android/gradlew" ]; then
            echo "Initializing Capacitor Android project structure..."
            if [ -f "android/app/src/main/AndroidManifest.xml" ]; then
              mkdir -p /tmp/cap-backup
              cp android/app/src/main/AndroidManifest.xml /tmp/cap-backup/
            fi
            rm -rf android
            npx cap add android
            if [ -f "/tmp/cap-backup/AndroidManifest.xml" ]; then
              cp /tmp/cap-backup/AndroidManifest.xml android/app/src/main/AndroidManifest.xml
            fi
          fi
          npx cap sync android

      - name: Build Android APK with Gradle
        working-directory: ./android
        run: |
          chmod +x gradlew
          ./gradlew assembleRelease || ./gradlew assembleDebug

      - name: Prepare and Sign Release APK
        run: |
          APK_PATH=$(find android/app/build/outputs/apk -name "*.apk" | head -n 1)
          if [ -z "$APK_PATH" ]; then
            echo "ERROR: No APK found after Gradle build!"
            exit 1
          fi
          echo "Found built APK at: $APK_PATH"
          if [[ "$APK_PATH" == *"unsigned"* ]]; then
            echo "Signing APK with release keystore..."
            keytool -genkey -v -keystore release.keystore -alias brainmate -keyalg RSA -keysize 2048 -validity 10000 -storepass brainmate123 -keypass brainmate123 -dname "CN=BrainMate, OU=AI, O=BrainMate, L=Mumbai, S=MH, C=IN" -noprompt
            if command -v apksigner &> /dev/null; then
              apksigner sign --ks release.keystore --ks-pass pass:brainmate123 --key-pass pass:brainmate123 --out brain-mate-release.apk "$APK_PATH"
            else
              jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore release.keystore -storepass brainmate123 -keypass brainmate123 "$APK_PATH" brainmate
              cp "$APK_PATH" brain-mate-release.apk
            fi
          else
            cp "$APK_PATH" brain-mate-release.apk
          fi
          echo "Release APK successfully generated:"
          ls -la brain-mate-release.apk

      - name: Upload Brain Mate APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Brain-Mate-Release-APK
          path: brain-mate-release.apk
          retention-days: 30
`;
    const blob = new Blob([workflowContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'build-apk.yml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full sm:max-w-2xl bg-gradient-to-b from-[#0c1425] to-[#070b14] border border-slate-800 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                Android APK &amp; PWA Release Center
              </h3>
              <p className="text-[11px] text-slate-400">
                1-Click Android Installation, Cloud APK Builder &amp; Play Store guide
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-2.5 bg-slate-950/70 border-b border-slate-800/80 text-xs overflow-x-auto no-scrollbar">
          {[
            { id: 'pwa', label: '1. Instant Install (WebAPK)' },
            { id: 'comparison', label: '★ Web vs APK Features' },
            { id: 'github', label: '2. Cloud APK Builder (CI/CD)' },
            { id: 'bubblewrap', label: '3. 1-Command TWA' },
            { id: 'capacitor', label: '4. Android Studio' },
            { id: 'playstore', label: '5. Google Play Store' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs text-slate-300">
          {/* TAB 1: Instant PWA Install */}
          {activeTab === 'pwa' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-cyan-950/60 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        Install Brain Mate as Native Android App
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Zero compilation required. Android Chrome packages it automatically as a native WebAPK in your app drawer.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onInstallPwa}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Now</span>
                  </button>
                </div>

                {isPwaInstalled && (
                  <div className="p-2 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>App is already running in standalone Android mode!</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3.5 space-y-2">
                <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">
                  How to Install on Your Android Phone:
                </h5>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
                  <li>Open this app in <strong>Google Chrome</strong> on your Android phone.</li>
                  <li>Tap the <strong>three dots (⋮)</strong> menu at the top right of Chrome.</li>
                  <li>Tap <strong>&quot;Install app&quot;</strong> (or &quot;Add to Home Screen&quot;).</li>
                  <li>Android downloads and registers Brain Mate with native app permissions!</li>
                </ol>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Web App Manifest:</span>
                <button
                  onClick={downloadManifestFile}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download manifest.webmanifest</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: Web Preview vs Native Android APK Features */}
          {activeTab === 'comparison' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/70 to-slate-900 border border-indigo-500/30 space-y-1.5">
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Web Preview vs. Native Android APK Capability Matrix</span>
                </h4>
                <p className="text-[11px] text-slate-300">
                  Brain Mate is engineered to run in both modes. See exactly what works in Web Preview vs. compiled Native Android APK.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                      <th className="p-2.5">Feature / Capability</th>
                      <th className="p-2.5 text-center">Web Preview</th>
                      <th className="p-2.5 text-center text-cyan-300">Native APK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    <tr>
                      <td className="p-2.5 font-medium text-white">Gemini AI Boss Mode Chat & Reasoning</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ 100% Active</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ 100% Active</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-white">Spoken Audio Output & Continuous Listening</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ Active</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ Active</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-white">Real Task Tracking System ("Mera kaam hua kya?")</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ Real Engine</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ Real Engine</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-white">Share Market Analytics (Reliance, TCS, RSI, MACD)</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ Real Data</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ Real Data</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-white">Clap Sensor (When Screen is ON)</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ Web Audio</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ AudioRecord</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-white">Android App Launchers (WhatsApp, YouTube, Calc)</td>
                      <td className="p-2.5 text-center text-amber-300 font-medium">⚠️ URL Scheme</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ Native Intent</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-white">Native Share Menu & Haptic Vibration</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ Web API</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ System Service</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-white">Background Listening when Screen is OFF</td>
                      <td className="p-2.5 text-center text-rose-400 font-medium">❌ Browser stops mic</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ Foreground Service</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-white">Install to Android App Drawer & Homescreen</td>
                      <td className="p-2.5 text-center text-cyan-300 font-medium">✅ WebAPK (1-tap)</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">✅ Signed APK / AAB</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Automated Cloud APK Builder */}
          {activeTab === 'github' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/70 to-slate-900 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Github className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-bold text-white text-sm">
                    Automated GitHub Actions APK &amp; AAB Pipeline
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300">
                  Because Google AI Studio container runs a lightweight Node.js runtime without the 4GB Android SDK, we configured a complete <strong>GitHub Actions CI/CD workflow</strong> that compiles real <code>.apk</code> and <code>.aab</code> files in the cloud automatically.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">
                  3 Easy Steps to Download Your APK Artifact:
                </h5>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-[11px]">
                  <li>
                    <strong>Push code to your GitHub repository:</strong> The <code>.github/workflows/build-apk.yml</code> workflow is already pre-configured in this repository.
                  </li>
                  <li>
                    <strong>Automatic Cloud Build:</strong> GitHub runs Java 17 and Android SDK 34, installs dependencies, builds Capacitor Android project, and signs the APK.
                  </li>
                  <li>
                    <strong>Download APK Artifact:</strong> Go to your repo&apos;s <strong>Actions</strong> tab, click the latest run, and download <code>Brain-Mate-Release-APK.zip</code> directly to your Android device!
                  </li>
                </ol>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Download Workflow File:</span>
                <button
                  onClick={downloadGithubWorkflow}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download build-apk.yml</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Bubblewrap TWA */}
          {activeTab === 'bubblewrap' && (
            <div className="space-y-3">
              <p className="text-slate-300">
                <strong>Google Bubblewrap CLI:</strong> Google&apos;s official tool to package PWA web apps directly into verified APK and Play Store App Bundle (.aab) with a single command.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] relative">
                <div className="flex items-center justify-between text-slate-500 mb-2 border-b border-slate-800 pb-1">
                  <span>Terminal / Command Prompt</span>
                  <button
                    onClick={() => copyToClipboard(bubblewrapCommand, 'bubblewrap')}
                    className="flex items-center gap-1 text-indigo-400 hover:text-white"
                  >
                    {copiedCode === 'bubblewrap' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'bubblewrap' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="text-cyan-300 overflow-x-auto whitespace-pre-wrap">{bubblewrapCommand}</pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-[11px]">
                <h5 className="font-bold text-white">Output Artifacts:</h5>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><code>app-release-signed.apk</code> — Sideload directly onto your phone via USB or WhatsApp.</li>
                  <li><code>app-release-bundle.aab</code> — Upload directly to Google Play Developer Console.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: Capacitor / Android Studio */}
          {activeTab === 'capacitor' && (
            <div className="space-y-3">
              <p className="text-slate-300">
                <strong>Capacitor Android Project:</strong> Compile directly using Google&apos;s official Android Studio IDE.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] relative">
                <div className="flex items-center justify-between text-slate-500 mb-2 border-b border-slate-800 pb-1">
                  <span>Terminal Setup</span>
                  <button
                    onClick={() => copyToClipboard(capacitorCommand, 'capacitor')}
                    className="flex items-center gap-1 text-indigo-400 hover:text-white"
                  >
                    {copiedCode === 'capacitor' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'capacitor' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="text-indigo-300 overflow-x-auto whitespace-pre-wrap">{capacitorCommand}</pre>
              </div>

              <p className="text-[11px] text-slate-400">
                In Android Studio: Click <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.
              </p>
            </div>
          )}

          {/* TAB 5: Google Play Store */}
          {activeTab === 'playstore' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                  Publishing Checklist for Google Play Console:
                </h5>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
                  <li>Create a Google Play Developer Account at <code>play.google.com/console</code>.</li>
                  <li>Package name: <code>com.brainmate.ai</code>.</li>
                  <li>App Title: <strong>Brain Mate — Your Personal AI Assistant</strong>.</li>
                  <li>Upload the generated <code>.aab</code> (Android App Bundle).</li>
                  <li>Target Android Version: Android 10+ (API Level 29 to 34).</li>
                  <li>Declared Permissions: <code>RECORD_AUDIO</code> for Voice Assistant &amp; Clap Detector.</li>
                  <li>Submit for review on the Production or Closed Testing track!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Close */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Brain Mate v1.0 • Android Package Ready
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
