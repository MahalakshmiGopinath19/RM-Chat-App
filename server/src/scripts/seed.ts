import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Department from '../models/Department';
import Team from '../models/Team';
import Chat from '../models/Chat';
import Message from '../models/Message';
import Announcement from '../models/Announcement';
import AuditLog from '../models/AuditLog';
import Notification from '../models/Notification';
import File from '../models/File';
import Task from '../models/Task';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rm-chat-app';

const runSeed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Clearing database collections...');

    await User.deleteMany({});
    await Department.deleteMany({});
    await Team.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
    await Announcement.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});
    await File.deleteMany({});
    await Task.deleteMany({});

    console.log('Creating Departments...');
    const deptDev = await Department.create({ name: 'Development', description: 'Engineering, Coding and Infrastructure' });
    const deptDigitalMarketing = await Department.create({ name: 'Digital Marketing', description: 'Brand, Design, PR and Campaigns' });
    const deptHR = await Department.create({ name: 'Human Resources', description: 'Employee welfare, Hiring and Policy' });
    await Department.create({ name: 'Sales', description: 'Enterprise sales, partnerships and customer acquisition' });
    await Department.create({ name: 'Video Editing', description: 'Video editing, post-production and motion graphics' });
    await Department.create({ name: 'Interns', description: 'Internship program and trainees' });
    await Department.create({ name: 'Operation Head', description: 'Operations and administrative head' });
    await Department.create({ name: 'Manager', description: 'Management and executive department' });

    console.log('Creating Users...');
    // Admin
    const admin = await User.create({
      employeeId: 'EMP001',
      name: 'System Admin',
      email: 'michaeldinesh@company.com',
      password: 'michaeldinesh@123',
      role: 'admin',
      status: 'active'
    });

    // HR Head
    const hrHead = await User.create({
      employeeId: 'EMP002',
      name: 'Meena',
      email: 'meenahr@company.com',
      password: 'meena@123',
      role: 'employee',
      status: 'active',
      department: deptHR._id
    });
    deptHR.head = hrHead._id;
    await deptHR.save();

    // Dev Head
    const devHead = await User.create({
      employeeId: 'EMP003',
      name: 'Sandeep',
      email: 'sandeepdev@company.com',
      password: 'sandeep@123',
      role: 'employee',
      status: 'active',
      department: deptDev._id
    });
    deptDev.head = devHead._id;
    await deptDev.save();

    // Dev 1
    const dev1 = await User.create({
      employeeId: 'EMP004',
      name: 'Shan',
      email: 'shandev@company.com',
      password: 'shan@123',
      role: 'employee',
      status: 'active',
      department: deptDev._id
    });   

    // Dev 2 (Inactive as a mock test)
    const dev2 = await User.create({
      employeeId: 'EMP005',
      name: 'Mahalakshmi',
      email: 'mahadev@company.com',
      password: 'mahadev@123',
      role: 'employee',
      status: 'active',
      department: deptDev._id
    });

    // Marketing Head
    const mktHead = await User.create({
      employeeId: 'EMP006',
      name: 'Poorvika',
      email: 'Poorvikamkt@company.com',
      password: 'poorvika@123',
      role: 'employee',
      status: 'active',
      department: deptDigitalMarketing._id
    });
    deptDigitalMarketing.head = mktHead._id;
    await deptDigitalMarketing.save();
    console.log('Creating Collaboration Teams...');

await Team.create({
  name: 'Web Development Team',
  description: 'Responsible for designing, developing, maintaining, and optimizing the company’s websites, web applications, and digital platforms.',
  department: deptDev._id,
  members: [devHead._id, dev1._id, dev2._id]
});

await Team.create({
  name: 'Social Media Marketing Team',
  description: 'Responsible for managing social media platforms, creating engaging content, executing digital marketing campaigns, and growing brand awareness across online channels.',
  department: deptDigitalMarketing._id,
  members: [mktHead._id, dev2._id]
});

await Team.create({
  name: 'Video Editing Team',
  description: 'Responsible for editing, enhancing, and producing high-quality video content for marketing campaigns, social media, brand promotions, and client projects.',
  department: deptDigitalMarketing._id,
  members: [mktHead._id]
}); 



    console.log('Creating Announcement Seeds...');
    await Announcement.create({
      title: 'New Workplace Security Policy',
      content: 'Starting next month, all employees must enable two-factor authentication on all company portals and devices. Detailed onboarding guidelines are available on the IT files share.',
      priority: 'important',
      audienceType: 'company',
      sender: admin._id
    });

    await Announcement.create({
      title: 'Dev Sprint Q3 Planning Meeting',
      content: 'Team, please review the sprint board and add your updates before Monday 9:00 AM. We will review task estimates during the call.',
      priority: 'normal',
      audienceType: 'department',
      audienceId: deptDev._id,
      sender: devHead._id
    });

    console.log('Creating Task Seeds...');
    await Task.create({
      title: 'Admin User Management & Dashboard Panel',
      description: 'Build and deploy the administrator panel for managing users, tracking user registration/status, and monitoring logins and logouts.',
      priority: 'P1',
      assignedTo: dev1._id,
      assignedBy: devHead._id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'in_progress'
    });

    await Task.create({
      title: 'Real-time Sockets Messaging Engine',
      description: 'Implement real-time bi-directional messaging, active user tracking, user presence toggles, and typing indicators using WebSockets.',
      priority: 'P2',
      assignedTo: dev2._id,
      assignedBy: devHead._id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'todo'
    });

    await Task.create({
      title: 'Secure Document Manager & File Sharing',
      description: 'Develop centralized department and team document libraries with folder-level encryption and access control list policies.',
      priority: 'P3',
      assignedTo: dev1._id,
      assignedBy: admin._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'todo'
    });

    await Task.create({
      title: 'Security Audits & Analytical PDF/Excel Reports',
      description: 'Generate compliance auditing trails and enable exportable PDF and Excel spreadsheet exports of session and activity logs.',
      priority: 'P4',
      assignedTo: devHead._id,
      assignedBy: admin._id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'completed'
    });

    console.log('Creating Audit Log Seeds...');
    await AuditLog.create({
      action: 'SYSTEM_SEED',
      details: 'Database populated with initial demo environment values.',
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script'
    });

    console.log('=============================================');
    console.log('  DATABASE SEEDED SUCCESSFULLY!');
    console.log('=============================================');
    console.log('  Admin Login: michaeldinesh@company.com / michaeldinesh@123');
    console.log('  Sandeep (Dev Lead): sandeepdev@company.com / sandeep@123');
    console.log('  Meena (HR Head): meenahr@company.com / meena@123');
    console.log('  Shan (Dev 1): shandev@company.com / shan@123');
    console.log('=============================================');
    process.exit(0);
  } catch (err) {
    console.error('Seed script error:', err);
    process.exit(1);
  }
};

runSeed();
