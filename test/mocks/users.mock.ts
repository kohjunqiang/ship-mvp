import { createMockUser, MockUser } from '../utils/test.utils';

export const mockUserAdmin: MockUser = createMockUser({
  email: 'admin@example.com',
  emailPassword: 'encrypted_admin_password',
  emailSettings: {
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
  },
  emailsProcessed: 10,
  matchedIntentions: 5,
});

export const mockUserRegular: MockUser = createMockUser({
  email: 'user@example.com',
  emailPassword: 'encrypted_user_password',
  emailSettings: {
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
  },
  emailsProcessed: 3,
  matchedIntentions: 1,
});

export const mockUserInactive: MockUser = createMockUser({
  email: 'inactive@example.com',
  emailPassword: 'encrypted_inactive_password',
  emailSettings: {
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
  },
  isActive: false,
});

export const mockUsers: MockUser[] = [
  mockUserAdmin,
  mockUserRegular,
  mockUserInactive,
];

export const mockUserService = {
  findOne: jest.fn().mockImplementation((_id: any) => 
    Promise.resolve(mockUsers.find(user => user._id?.equals(_id)))
  ),
  findAll: jest.fn().mockResolvedValue(mockUsers),
  create: jest.fn().mockImplementation((dto) => 
    Promise.resolve({ _id: 'new-id', ...dto })
  ),
  update: jest.fn().mockImplementation((_id, dto) => 
    Promise.resolve({ ...mockUsers.find(user => user._id?.equals(_id)), ...dto })
  ),
  remove: jest.fn().mockImplementation((_id: any) =>
    Promise.resolve(mockUsers.find(user => user._id?.equals(_id)))
  ),
  getDecryptedEmailPassword: jest.fn().mockResolvedValue('decrypted_password'),
  updateStatistics: jest.fn().mockImplementation((_id, emailProcessed, intentionMatched) =>
    Promise.resolve({
      ...mockUsers.find(user => user._id?.equals(_id)),
      emailsProcessed: emailProcessed ? 101 : 100,
      matchedIntentions: intentionMatched ? 76 : 75,
    })
  ),
};
