export default class Team {
  constructor() {
    this.members = new Set();
  }

  add(member) {
    this.members.add(member);
  }

  addAll(...allMembers) {
    allMembers.forEach((member) => {
      this.members.add(member);
    });
  }

  toArray() {
    return [...this.members];
  }
}
