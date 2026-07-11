import { syncRead } from './sync-read';
import { syncReading } from './sync-reading';
import { syncUpNext } from './sync-up-next';

const syncBooks = async () => {
  await syncRead();
  await syncReading();
  await syncUpNext();
};

syncBooks();
