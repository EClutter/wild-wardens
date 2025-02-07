import Dexie, { type Table } from "dexie";
interface Creature {
    id?: number;
    name: string;
    type: string;
    description: string;
    feed: number;
    lastFeedTime: Date;
}

class WardensDatabase extends Dexie {
    creatures!: Table<Creature, number>;

    constructor() {
        super('WardensDatabase');
        this.version(1).stores({
            creatures: '++id, lastFeedTime'
        });
    }
}

const db = new WardensDatabase();
db.on('populate', async () => {
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

export type { Creature };
export default db;
