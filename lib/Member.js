class Member {

  constructor(member, vertex) {
    this.self = member.name == vertex.name;

  }


  record(member) {
    console.log('RECORD (late)', member);
  }

}

module.exports = Member;
