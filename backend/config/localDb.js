const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const files = {
  inquiries: path.join(dataDir, 'inquiries.json'),
  notices: path.join(dataDir, 'notices.json'),
};

// Ensure data files exist
Object.values(files).forEach((file) => {
  if (!fs.existsSync(file)) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(file, JSON.stringify([]));
  }
});

const readData = (collection) => {
  const data = fs.readFileSync(files[collection], 'utf-8');
  return JSON.parse(data);
};

const writeData = (collection, data) => {
  fs.writeFileSync(files[collection], JSON.stringify(data, null, 2));
};

module.exports = {
  inquiries: {
    find: (query = {}) => {
      let data = readData('inquiries');
      if (query.status) data = data.filter(i => i.status === query.status);
      if (query.category) data = data.filter(i => i.category === query.category);
      if (query.search) {
        const s = query.search.toLowerCase();
        data = data.filter(i => 
          (i.name && i.name.toLowerCase().includes(s)) ||
          (i.phone && i.phone.toLowerCase().includes(s)) ||
          (i.message && i.message.toLowerCase().includes(s))
        );
      }
      return data;
    },
    findById: (id) => readData('inquiries').find(i => i._id === id),
    create: (inquiryData) => {
      const data = readData('inquiries');
      const newInquiry = { 
        ...inquiryData, 
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        notificationStatus: { emailSent: false, whatsappSent: false, emailError: null, whatsappError: null }
      };
      data.push(newInquiry);
      writeData('inquiries', data);
      return newInquiry;
    },
    findByIdAndUpdate: (id, updates) => {
      const data = readData('inquiries');
      const index = data.findIndex(i => i._id === id);
      if (index === -1) return null;
      
      // Handle nested object updates like notificationStatus
      if (updates['notificationStatus.emailSent'] !== undefined) {
        data[index].notificationStatus = data[index].notificationStatus || {};
        data[index].notificationStatus.emailSent = updates['notificationStatus.emailSent'];
        data[index].notificationStatus.whatsappSent = updates['notificationStatus.whatsappSent'];
        data[index].notificationStatus.emailError = updates['notificationStatus.emailError'];
        data[index].notificationStatus.whatsappError = updates['notificationStatus.whatsappError'];
      } else {
        data[index] = { ...data[index], ...updates };
      }
      
      writeData('inquiries', data);
      return data[index];
    },
    countDocuments: (query = {}) => module.exports.inquiries.find(query).length
  },
  notices: {
    find: (query = {}) => {
      let data = readData('notices');
      if (query.isActive !== undefined) data = data.filter(n => n.isActive === query.isActive);
      if (query.category) data = data.filter(n => n.category === query.category);
      return data;
    },
    findById: (id) => readData('notices').find(n => n._id === id),
    create: (noticeData) => {
      const data = readData('notices');
      const newNotice = { 
        ...noticeData, 
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isActive: true
      };
      data.push(newNotice);
      writeData('notices', data);
      return newNotice;
    },
    findByIdAndUpdate: (id, updates) => {
      const data = readData('notices');
      const index = data.findIndex(n => n._id === id);
      if (index === -1) return null;
      
      const updateData = updates.$set || updates;
      data[index] = { ...data[index], ...updateData };
      writeData('notices', data);
      return data[index];
    },
    findByIdAndDelete: (id) => {
      let data = readData('notices');
      const index = data.findIndex(n => n._id === id);
      if (index === -1) return null;
      const deleted = data.splice(index, 1)[0];
      writeData('notices', data);
      return deleted;
    },
    countDocuments: () => readData('notices').length
  }
};
