const { Scheduling, addSubjects } = require("../Algorithm");
const admin = require("firebase-admin");
const docs = require("../constants/docs");
const db = admin.firestore();

const generateTT = async (req, res) => {
  const userID = req.body["userID"];
  if (!userID) {
    res.send(401);
    return;
  }

  const collection = db.collection(userID);

  const snapshot = await collection.get();

  let l;
  let subjects;
  let workingTime;

  if (snapshot.empty || snapshot.size === 0) {
    res.send(401);
    return;
  }

  snapshot.forEach((snap) => {
    if (snap.id === docs.lectures) l = Object.values(snap.data());
    else if (snap.id === docs.subjects) subjects = Object.values(snap.data());
    else if (snap.id === docs.workingTime) workingTime = snap.data();
  });

  const t = l
    .map((e) => e[0])
    .filter((value, index, self) => self.indexOf(value) === index);

  const sections = l
    .map((e) => e[1])
    .filter((value, index, self) => self.indexOf(value) === index);

  subjects = addSubjects(subjects);

  const teacherLec = t.map((teacher) => {
    return {
      name: teacher,
      assigned: [],
    };
  });
  teacherLec.forEach((lac) => {
    l.forEach((lec) => {
      if (lec[0] === lac.name)
        lac.assigned.push({
          class: lec[1],
          subject: subjects[subjects.findIndex((s) => s.code === lec[2])],
          lecture: lec[3],
        });
    });
  });
  const days = workingTime
    ? Object?.values(workingTime)?.filter((wt) => wt !== 0)
    : [];

  const period = {
    d: days.length,
    p: days.length > 0 ? days?.reduce((a, b) => Math.max(a, b)) : days,
  };

  const finalized = Scheduling(teacherLec, sections, period);

  // Delete the old timetable documents
  const batch = db.batch();
  const snapTimetable = await collection
    .doc(docs.timeTable)
    .collection(docs.timeTable)
    .get();
  if (snapTimetable.size !== 0) {
    snapTimetable.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log("Previous Timetable Docuements Deleted successfully.");
  }

  // Storing Timetable in Database
  finalized.forEach(async (tt, i) => {
    await collection
      .doc(docs.timeTable)
      .collection(docs.timeTable)
      .doc(sections[i])
      .set({ ...Object(tt.map((e) => Object(e))) })
      .catch((e) => console.log(e));
  });
  res.send(sections);
};

module.exports = generateTT;
