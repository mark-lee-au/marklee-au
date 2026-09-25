import { randomUUID } from "node:crypto";
import { randomPassword, hashPassword, readUsers, writeUsers } from './store.mjs';

// A fresh, one-time password is printed locally. Never ship an account or hash in the patch.
const password = randomPassword();
const database = await readUsers();
const root = { username: 'mark', passwordHash: await hashPassword(password), root: true, permissions: ['home', 'projects', 'games'], revision: randomUUID() };
database.users = [root, ...database.users.filter((user) => user.username !== 'mark')];
await writeUsers(database);
console.log('Local admin account: mark');
console.log(`Temporary password (shown once): ${password}`);
console.log('Store this outside the repository. Existing admin sessions are invalidated.');
