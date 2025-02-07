import Dexie, { type Table } from "dexie";
//interface for the warden which will contain the player information
interface Warden {
  id?: number;
  name: string;
  experience: number;
  credits: number;
}

interface Creature {
  id?: number;
  name: string;
  type: string;
  description: string;
  feed: number;
  lastFeedTime: Date;
}

class WardensDatabase extends Dexie {
  wardens!: Table<Warden, number>;
  creatures!: Table<Creature, number>;

  constructor() {
    super('WardensDatabase');
    this.version(1).stores({
      wardens: '++id, name, experience, credits',
      creatures: '++id, lastFeedTime'
    });
  }
}

const db = new WardensDatabase();
db.on('populate', async () => {
  const randomName = wackyGeneralNames[Math.floor(Math.random() * wackyGeneralNames.length)];

  await db.wardens.bulkAdd([
    {
      name: randomName,
      experience: 0,
      credits: 0
    }
  ]);
  await db.creatures.bulkAdd([
    {
      name: 'griffin',
      type: 'mythical',
      description: 'the default creature guarding your sanctuary',
      feed: 100,
      lastFeedTime: new Date()
    }
  ]);
});

export type { Warden, Creature };
export default db;

const wackyGeneralNames = [
  'general giggles Grant',
  'marshal macaroni Lincoln',
  'commander crumpet Caesar',
  'admiral absurdity Napoleon',
  'colonel confetti Washington',
  'brigadier banana Bonaparte',
  'captain calamity Churchill',
  'major maverick McKinley',
  'field marshal funky Franklin',
  'general zany Zollner',
  'commander kooky Kennedy',
  'admiral apricot Alexander',
  'colonel quirky Quincy',
  'major mischief Monroe',
  'brigadier bouncing Beethoven',
  'general goofy Grant',
  'captain quirky Quincy',
  'marshal misfit Monroe',
  'commander candy Caesar',
  'admiral avocado Abe'
];