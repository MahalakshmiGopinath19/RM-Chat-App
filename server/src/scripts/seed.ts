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

    console.log('Creating Departments...');
    const deptDev = await Department.create({ name: 'Development', description: 'Engineering, Coding and Infrastructure' });
    const deptMarketing = await Department.create({ name: 'Marketing', description: 'Brand, Design, PR and Campaigns' });
    const deptHR = await Department.create({ name: 'Human Resources', description: 'Employee welfare, Hiring and Policy' });
    const deptSales = await Department.create({ name: 'Sales', description: 'Enterprise sales, partnerships and customer acquisition' });

    console.log('Creating Users...');
    // Admin
    const admin = await User.create({
      employeeId: 'EMP001',
      name: 'System Admin',
      email: 'maha@company.com',
      password: 'maha@123',
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
      department: deptMarketing._id
    });
    deptMarketing.head = mktHead._id;
    await deptMarketing.save();
    console.log('Creating Collaboration Teams...');

const teamWeb = await Team.create({
  name: 'Web Development Team',
  description: 'Responsible for designing, developing, maintaining, and optimizing the company’s websites, web applications, and digital platforms.',
  department: deptDev._id,
  members: [devHead._id, dev1._id, dev2._id]
});

const teamSocialMedia = await Team.create({
  name: 'Social Media Marketing Team',
  description: 'Responsible for managing social media platforms, creating engaging content, executing digital marketing campaigns, and growing brand awareness across online channels.',
  department: deptMarketing._id,
  members: [mktHead._id, dev2._id]
});

const teamVideoEditing = await Team.create({
  name: 'Video Editing Team',
  description: 'Responsible for editing, enhancing, and producing high-quality video content for marketing campaigns, social media, brand promotions, and client projects.',
  department: deptMarketing._id,
  members: [mktHead._id]
}); 

    // Create Chats for Departments
    const chatDeptDev = await Chat.create({ type: 'department', department: deptDev._id });
    await Chat.create({ type: 'department', department: deptMarketing._id });
    await Chat.create({ type: 'department', department: deptHR._id });
    await Chat.create({ type: 'department', department: deptSales._id });

    // Create Chats for Teams
    await Chat.create({ type: 'team', team: teamWeb._id });
    await Chat.create({ type: 'team', team: teamSocialMedia._id });
    await Chat.create({ type: 'team', team: teamVideoEditing._id });

    console.log('Creating Direct Message Chat Seeds...');
    // DM Chat between Dev Head and Developer 1
    const directChat = await Chat.create({
      type: 'direct',
      participants: [devHead._id, dev1._id]
    });

    console.log('Creating Chat Messages Seeds...');
    // Send a message in Dev Department Chat
    await Message.create({
      chat: chatDeptDev._id,
      sender: devHead._id,
      content: 'Welcome everyone to the official Development Department channel! Check out the announcement panel for coding standards.',
      readBy: [{ user: devHead._id, readAt: new Date() }]
    });

    // Seed direct messages between Marcus and John
    await Message.create({
      chat: directChat._id,
      sender: devHead._id,
      content: 'Hey Shan, do you have updates on the authentication workflow integration?',
      readBy: [{ user: devHead._id, readAt: new Date() }]
    });

    await Message.create({
      chat: directChat._id,
      sender: dev1._id,
      content: 'Hi Maha, yes! The APIs are written and I am wiring them up on the React client. I will post it to Web Development Team channel once ready.',
      readBy: [
        { user: dev1._id, readAt: new Date() },
        { user: devHead._id, readAt: new Date() }
      ]
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
    console.log('  Admin Login: maha@company.com / maha@123');
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
