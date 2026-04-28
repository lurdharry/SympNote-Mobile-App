import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRecordingsStore } from '@/stores/useRecordingsStore';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { showError, showInfo } from '@/components/ui/Toast';

const EXPORT_FILENAME = 'sympnote-export.json';
const EXPORT_VERSION = 1;

/**
 * Write the user's recordings + appointments to a cache-scoped JSON
 * file and open the native share sheet. Falls back to an alert when
 * sharing is unavailable so the user isn't left wondering.
 */
export const exportUserData = async (): Promise<void> => {
  try {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: EXPORT_VERSION,
      recordings: useRecordingsStore.getState().recordings,
      appointments: useAppointmentsStore.getState().appointments,
    };

    const file = new File(Paths.cache, EXPORT_FILENAME);
    if (file.exists) file.delete();
    file.create();
    file.write(JSON.stringify(payload, null, 2));

    const ok = await Sharing.isAvailableAsync();
    if (!ok) {
      showInfo('Sharing unavailable', { body: 'File saved to cache.' });
      return;
    }
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Sympnote data',
    });
  } catch (e) {
    showError('Export failed', { body: String(e) });
  }
};
