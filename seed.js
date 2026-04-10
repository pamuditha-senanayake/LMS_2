const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://pamudithasenanayake_db_user:6z2N1JOVjnzOlFu7@cluster0.2pv8a2t.mongodb.net/lms?appName=Cluster0";

async function run() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("lms");

    // Clear old seeded data
    await db.collection("bookings").deleteMany({});
    await db.collection("notifications").deleteMany({});
    await db.collection("users").deleteMany({ email: { $in: ["admin@lms.com", "lecturer@lms.com", "student@lms.com"] } });

    const now = new Date();
    
    // Spring Security 5+ requires {bcrypt} prefix to recognize it
    const hash = "{bcrypt}$2a$10$qxJ5Bv/H98n2R/xOKh0VpeJ0p2bJgI8F88/kRz7y9JbO/W2hV6X6K"; 

    const adminId = new ObjectId();
    const lecturerId = new ObjectId();
    const studentId = new ObjectId();

    const users = [
        {
            _id: adminId,
            _class: "com.lms.backend.model.User",
            fullName: "Admin Boss",
            name: "Admin Boss",
            email: "admin@lms.com",
            password: hash,
            phone: "0770000000",
            roles: ["ROLE_ADMIN"],
            createdAt: now,
            updatedAt: now
        },
        {
            _id: lecturerId,
            _class: "com.lms.backend.model.User",
            fullName: "Dr. Lecturer",
            name: "Dr. Lecturer",
            email: "lecturer@lms.com",
            password: hash,
            phone: "0771111111",
            roles: ["ROLE_LECTURER"],
            createdAt: now,
            updatedAt: now
        },
        {
            _id: studentId,
            _class: "com.lms.backend.model.User",
            fullName: "Smart Student",
            name: "Smart Student",
            email: "student@lms.com",
            password: hash,
            phone: "0772222222",
            roles: ["ROLE_STUDENT"],
            createdAt: now,
            updatedAt: now
        }
    ];

    await db.collection("users").insertMany(users);
    console.log("3 Users created:\n - admin@lms.com\n - lecturer@lms.com\n - student@lms.com\n");

    const user1Id = lecturerId.toString();
    const user2Id = studentId.toString();
    
    const bookings = [
      {
        _class: "com.lms.backend.model.Booking",
        resourceId: "Auditorium Main",
        purpose: "Mock Data: Annual AI Summit",
        expectedAttendees: 300,
        startTime: new Date(now.getTime() + 86400000), 
        endTime: new Date(now.getTime() + 90000000), 
        requestedBy: {
          userId: user1Id,
          name: "Dr. Lecturer",
          email: "lecturer@lms.com"
        },
        status: "PENDING",
        createdAt: now,
        updatedAt: now
      },
      {
        _class: "com.lms.backend.model.Booking",
        resourceId: "Computer Lab 4",
        purpose: "Mock Data: Python Scripting Basics",
        expectedAttendees: 40,
        startTime: new Date(now.getTime() + 172800000), 
        endTime: new Date(now.getTime() + 176400000), 
        requestedBy: {
          userId: user2Id,
          name: "Smart Student",
          email: "student@lms.com"
        },
        status: "APPROVED",
        approvedAt: now,
        createdAt: now,
        updatedAt: now
      },
      {
        _class: "com.lms.backend.model.Booking",
        resourceId: "Conference Room B",
        purpose: "Mock Data: Faculty Strategy Meeting",
        expectedAttendees: 15,
        startTime: new Date(now.getTime() - 86400000), 
        endTime: new Date(now.getTime() - 80000000), 
        requestedBy: {
          userId: user1Id,
          name: "Dr. Lecturer",
          email: "lecturer@lms.com"
        },
        status: "REJECTED",
        rejectionReason: "Overlap with Board Meeting.",
        createdAt: now,
        updatedAt: now
      }
    ];

    const result = await db.collection("bookings").insertMany(bookings);
    console.log(`${result.insertedCount} mock bookings inserted.`);

    const notifications = [
      {
        _class: "com.lms.backend.model.Notification",
        recipientUserId: adminId.toString(),
        title: "Mock: Welcome Admin!",
        message: "You can manage user bookings and send notices.",
        notificationType: "SYSTEM",
        isRead: false,
        createdAt: now
      },
      {
        _class: "com.lms.backend.model.Notification",
        recipientUserId: adminId.toString(),
        title: "Mock: System Maintenance",
        message: "Scheduled updates this weekend.",
        notificationType: "WARNING",
        isRead: true,
        createdAt: new Date(now.getTime() - 10000)
      }
    ];

    const nResult = await db.collection("notifications").insertMany(notifications);
    console.log(`${nResult.insertedCount} mock notifications inserted.`);

  } catch(e) {
      console.log(e);
  } finally {
    await client.close();
  }
}

run();
