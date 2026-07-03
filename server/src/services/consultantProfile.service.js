import ConsultantProfile from '../models/ConsultantProfile.js';
import ClientUser from '../models/ClientUser.js';
import bcrypt from 'bcryptjs';

export const getAllConsultantProfiles = async (currentUser) => {
  let query = {};
  
  if (currentUser.role === 'consultant' && currentUser.department) {
    query.department = currentUser.department._id || currentUser.department;
  }
  
  return await ConsultantProfile.find(query)
    .populate('user', 'name email role department employeeCode')
    .populate('department', 'name description categories');
};

export const getConsultantProfilesByDepartment = async (currentUser, departmentId) => {
  if (currentUser.role === 'consultant') {
    const userDept = currentUser.department._id || currentUser.department;
    if (userDept.toString() !== departmentId) {
      throw new Error('You can only view profiles from your own department');
    }
  }
  
  return await ConsultantProfile.find({ department: departmentId })
    .populate('user', 'name email role department employeeCode')
    .populate('department', 'name description categories');
};

export const getConsultantProfileById = async (currentUser, id) => {
  const profile = await ConsultantProfile.findById(id)
    .populate('user', 'name email role department employeeCode')
    .populate('department', 'name description categories');
  
  if (!profile) {
    throw new Error('Consultant profile not found');
  }
  
  const isSelf = profile.user._id.toString() === currentUser._id.toString();
  const isConsultantOrSuperadmin = ['superadmin', 'consultant'].includes(currentUser.role);
  
  if (!isSelf && !isConsultantOrSuperadmin) {
    throw new Error('You do not have permission to view this profile');
  }
  
  if (currentUser.role === 'consultant' && !isSelf) {
    const userDept = currentUser.department._id || currentUser.department;
    const profileDept = profile.department._id || profile.department;
    
    if (userDept.toString() !== profileDept.toString()) {
      throw new Error('You can only view profiles from your own department');
    }
  }
  
  return profile;
};

export const getMyConsultantProfile = async (currentUser) => {
  const profile = await ConsultantProfile.findOne({ user: currentUser._id })
    .populate('user', 'name email role department employeeCode')
    .populate('department', 'name description categories');
  
  if (!profile) {
    throw new Error('Consultant profile not found');
  }
  
  return profile;
};

export const createConsultantProfile = async (data) => {
  const { name, email, password, expertise, department, categories, phone, employeeId } = data;

  const existingUser = await ClientUser.findOne({ email });
  if (existingUser) {
    throw new Error('Consultant with this email already exists');
  }

  if (employeeId) {
    const existingCode = await ClientUser.findOne({ employeeCode: employeeId });
    if (existingCode) {
      throw new Error('Employee ID already exists');
    }
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = new ClientUser({
    email,
    password: hashedPassword,
    name,
    employeeCode: employeeId,
    role: 'consultant',
    department
  });

  await user.save();

  const profile = new ConsultantProfile({
    user: user._id,
    expertise,
    department,
    categories,
    phone,
    employeeId
  });

  await profile.save();

  return await ConsultantProfile.findById(profile._id)
    .populate('user', 'name email role department employeeCode')
    .populate('department', 'name description categories');
};

export const updateConsultantProfile = async (id, data) => {
  const { name, expertise, phone, employeeId, department, categories } = data;

  const profile = await ConsultantProfile.findById(id);
  if (!profile) {
    throw new Error('Consultant profile not found');
  }

  if (name || department) {
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (department) userUpdate.department = department;
    
    await ClientUser.findByIdAndUpdate(profile.user, userUpdate);
  }

  const updateData = {};
  if (expertise !== undefined) updateData.expertise = expertise;
  if (phone !== undefined) updateData.phone = phone;
  if (employeeId !== undefined) updateData.employeeId = employeeId;
  if (department !== undefined) updateData.department = department;
  if (categories !== undefined) updateData.categories = categories;
  updateData.updatedAt = Date.now();

  return await ConsultantProfile.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('user', 'name email role department employeeCode')
    .populate('department', 'name description categories');
};

export const updateMyConsultantProfile = async (currentUser, { expertise, phone }) => {
  const profile = await ConsultantProfile.findOne({ user: currentUser._id });
  if (!profile) {
    throw new Error('Consultant profile not found');
  }

  const updateData = {};
  if (expertise !== undefined) updateData.expertise = expertise;
  if (phone !== undefined) updateData.phone = phone;
  updateData.updatedAt = Date.now();

  return await ConsultantProfile.findByIdAndUpdate(
    profile._id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('user', 'name email role department employeeCode')
    .populate('department', 'name description categories');
};

export const updateLimitedConsultantProfile = async (currentUser, id, { expertise, phone }) => {
  const profile = await ConsultantProfile.findById(id);
  if (!profile) {
    throw new Error('Consultant profile not found');
  }

  const isSelf = profile.user.toString() === currentUser._id.toString();
  
  if (currentUser.role === 'consultant' && !isSelf) {
    const userDept = currentUser.department._id || currentUser.department;
    const profileDept = profile.department;
    
    if (userDept.toString() !== profileDept.toString()) {
      throw new Error('You can only update profiles from your own department');
    }
  }

  const updateData = {};
  if (expertise !== undefined) updateData.expertise = expertise;
  if (phone !== undefined) updateData.phone = phone;
  updateData.updatedAt = Date.now();

  return await ConsultantProfile.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('user', 'name email role department employeeCode')
    .populate('department', 'name description categories');
};

export const deleteConsultantProfile = async (id) => {
  const profile = await ConsultantProfile.findById(id);
  if (!profile) {
    throw new Error('Consultant profile not found');
  }

  await ClientUser.findByIdAndDelete(profile.user);
  await ConsultantProfile.findByIdAndDelete(id);
};

export const searchConsultantProfiles = async (currentUser, query) => {
  if (!query || query.trim() === '') {
    throw new Error('Search query is required');
  }

  let searchQuery = {};
  
  if (currentUser.role === 'consultant' && currentUser.department) {
    searchQuery.department = currentUser.department._id || currentUser.department;
  }

  const users = await ClientUser.find({
    $and: [
      { role: 'consultant' },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { employeeCode: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  }).select('_id');

  const userIds = users.map(user => user._id);
  searchQuery.user = { $in: userIds };

  return await ConsultantProfile.find(searchQuery)
    .populate('user', 'name email role department employeeCode')
    .populate('department', 'name description categories');
};
