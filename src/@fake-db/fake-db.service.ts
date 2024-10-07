import { InMemoryDbService } from "angular-in-memory-web-api";
import { UsersFakeData } from "./users.data";

export class FakeDbService implements InMemoryDbService {
  createDb(): any {
    return {
      // Users
      "users-data": UsersFakeData.users,
    };
  }
}
