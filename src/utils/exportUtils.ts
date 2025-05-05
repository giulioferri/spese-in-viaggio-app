
import { Trip, Expense } from "@/lib/tripStorage/types";

interface PhotoItem {
  name: string;
  blob: Blob;
}

export const getFileExtension = (url: string): string => {
  const match = url.match(/\.([^.]+)(?:\?.*)?$/);
  return match ? `.${match[1].toLowerCase()}` : '.jpg';
};

export const createTripCSV = (trips: Trip[]): Blob => {
  const headers = ['Luogo', 'Data', 'Importo', 'Descrizione'];
  let csvContent = headers.join(';') + '\n';
  
  trips.forEach(trip => {
    trip.expenses.forEach((exp: Expense) => {
      const euroAmount = Number(exp.amount)
        .toFixed(2)
        .replace('.', ',');
      const row = [
        trip.location,
        new Date(trip.date).toLocaleDateString('it-IT'),
        euroAmount,
        (typeof exp.comment === 'string' ? exp.comment.replace(/[\n\r;]/g, ' ') : '')
      ];
      csvContent += row.join(';') + '\n';
    });
  });

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

export const downloadCSV = (csvContent: Blob, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const fetchTripPhotos = async (trips: Trip[]): Promise<PhotoItem[]> => {
  const photoPromises = trips.flatMap(trip => 
    trip.expenses
      .filter((exp) => exp.photoUrl)
      .map(async (exp) => {
        try {
          const response = await fetch(exp.photoUrl);
          const blob = await response.blob();
          // Crea la struttura delle cartelle con il formato yyyy-mm-dd__luogo
          const folderName = `${trip.date}__${trip.location}`;
          return {
            name: `${folderName}/${exp.id}${getFileExtension(exp.photoUrl)}`,
            blob
          };
        } catch (error) {
          console.error('Errore nel download della foto:', error);
          return null;
        }
      })
  );

  const photos = (await Promise.all(photoPromises)).filter((photo): photo is PhotoItem => photo !== null);
  return photos;
};

export const createAndDownloadZip = async (
  csvBlob: Blob, 
  photos: PhotoItem[], 
  zipFilename: string
): Promise<void> => {
  try {
    const JSZip = await import('jszip');
    const zip = new JSZip.default();

    zip.file('riepilogo_spese.csv', csvBlob);

    photos.forEach(photo => {
      zip.file(`photos/${photo.name}`, photo.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = zipUrl;
    link.download = zipFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(zipUrl);

    return Promise.resolve();
  } catch (error) {
    console.error('Errore durante la creazione dello ZIP:', error);
    return Promise.reject(error);
  }
};
