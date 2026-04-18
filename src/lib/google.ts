const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string;
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

export interface DriveFile {
  id: string;
  name: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Gapi = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Google = any;

declare global {
  interface Window {
    gapi: Gapi;
    google: Google;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

export async function initGoogleApis(): Promise<void> {
  await Promise.all([
    loadScript('https://apis.google.com/js/api.js'),
    loadScript('https://accounts.google.com/gsi/client'),
  ]);
  await new Promise<void>(resolve => window.gapi.load('picker', resolve));
}

export function createTokenClient(
  onToken: (token: string) => void,
  onError: () => void,
): { requestAccessToken: () => void } {
  return window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: (resp: { error?: string; access_token: string }) => {
      if (resp.error) { onError(); return; }
      onToken(resp.access_token);
    },
  });
}

export function openDrivePicker(
  accessToken: string,
  onPicked: (files: DriveFile[]) => void,
): void {
  const { PickerBuilder, DocsView, Feature, Action } = window.google.picker;
  new PickerBuilder()
    .addView(
      new DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false)
    )
    .setOAuthToken(accessToken)
    .setDeveloperKey(API_KEY)
    .enableFeature(Feature.MULTISELECT_ENABLED)
    .setCallback((data: { action: string; docs: Array<{ id: string; name: string }> }) => {
      if (data.action === Action.PICKED) {
        onPicked(data.docs.map(d => ({
          id: d.id,
          name: d.name.replace(/\.(md|markdown)$/i, ''),
        })));
      }
    })
    .build()
    .setVisible(true);
}

export async function fetchFileContent(fileId: string, accessToken: string): Promise<string> {
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!resp.ok) throw new Error(`Drive error: ${resp.status}`);
  return resp.text();
}
