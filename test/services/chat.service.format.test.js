const { expect } = require('chai');

const ChatService = require('../../src/services/chat.service');

describe('ChatService formatting helpers', () => {
  describe('formatConversationResponse', () => {
    it('returns nested participant objects and last activity metadata', () => {
      const conversation = {
        id: 7,
        conversation_id: 'conv_demo_123',
        patient_id: 12,
        patient_first_name: 'Jane',
        patient_last_name: 'Doe',
        patient_email: 'jane@example.com',
        doctor_id: 34,
        doctor_first_name: 'Gregory',
        doctor_last_name: 'House',
        doctor_email: 'greg@example.com',
        title: 'Post adjustment check-in',
        description: 'Follow-up chat after recent session',
        participant_type: 'patient-doctor',
        status: 'active',
        last_message: 'Remember to stretch daily!',
        last_message_at: '2025-02-01T10:15:00.000Z',
        unread_count: 2,
        created_at: '2025-01-31T18:00:00.000Z',
        updated_at: '2025-02-01T10:15:00.000Z'
      };

      const formatted = ChatService.formatConversationResponse(conversation);

      expect(formatted).to.include({
        id: 7,
        conversation_id: 'conv_demo_123',
        title: 'Post adjustment check-in',
        participant_type: 'patient-doctor',
        status: 'active',
        unread_count: 2
      });

      expect(formatted.participants.patient).to.deep.include({
        id: 12,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com'
      });
      expect(formatted.participants.patient.full_name).to.equal('Jane Doe');

      expect(formatted.participants.doctor).to.deep.include({
        id: 34,
        first_name: 'Gregory',
        last_name: 'House',
        email: 'greg@example.com'
      });
      expect(formatted.participants.doctor.full_name).to.equal('Gregory House');

      expect(formatted.last_activity).to.deep.equal({
        message: 'Remember to stretch daily!',
        occurred_at: '2025-02-01T10:15:00.000Z'
      });
    });

    it('derives participant names from fallback strings when detailed fields are missing', () => {
      const conversation = {
        id: 9,
        conversation_id: 'conv_demo_456',
        patient_id: 44,
        patient_name: 'Sam Patient',
        doctor_id: 55,
        doctor_name: 'Dr Admin',
        title: 'General enquiry',
        description: null,
        participant_type: 'patient-admin',
        status: 'active',
        created_at: '2025-02-10T12:00:00.000Z',
        updated_at: '2025-02-10T12:05:00.000Z'
      };

      const formatted = ChatService.formatConversationResponse(conversation);

      expect(formatted.participants.patient).to.deep.include({
        id: 44,
        first_name: 'Sam',
        last_name: 'Patient'
      });
      expect(formatted.participants.doctor).to.deep.include({
        id: 55,
        first_name: 'Dr',
        last_name: 'Admin'
      });
      expect(formatted.last_activity).to.deep.equal({
        message: null,
        occurred_at: '2025-02-10T12:05:00.000Z'
      });
    });
  });

  describe('formatMessageResponse', () => {
    it('wraps sender metadata and attachment details in nested structures', () => {
      const message = {
        id: 123,
        conversation_id: 'conv_demo_123',
        sender_id: 12,
        sender_type: 'patient',
        sender_first_name: 'Jane',
        sender_last_name: 'Doe',
        sender_email: 'jane@example.com',
        content: 'How long should the exercises last?',
        message_type: 'text',
        attachment_url: 'https://example.com/stretch.png',
        attachment_type: 'image/png',
        delivery_status: 'sent',
        is_read: false,
        sent_at: '2025-02-01T10:16:00.000Z',
        updated_at: '2025-02-01T10:16:00.000Z'
      };

      const formatted = ChatService.formatMessageResponse(message);

      expect(formatted.id).to.equal(123);
      expect(formatted.sender).to.deep.include({
        id: 12,
        type: 'patient',
        name: 'Jane Doe',
        email: 'jane@example.com'
      });
      expect(formatted.attachment).to.deep.equal({
        url: 'https://example.com/stretch.png',
        type: 'image/png'
      });
      expect(formatted.delivery_status).to.equal('sent');
      expect(formatted.is_read).to.equal(false);
    });

    it('infers sender name from provided display name when first and last are unavailable', () => {
      const message = {
        id: 321,
        conversation_id: 'conv_demo_456',
        sender_id: 99,
        sender_type: 'admin',
        sender_name: 'Support Agent',
        content: 'We will follow up shortly.',
        message_type: 'text',
        delivery_status: null,
        is_read: true,
        sent_at: '2025-02-11T09:00:00.000Z',
        updated_at: '2025-02-11T09:00:00.000Z'
      };

      const formatted = ChatService.formatMessageResponse(message);

      expect(formatted.sender).to.deep.include({
        id: 99,
        type: 'admin',
        name: 'Support Agent'
      });
      expect(formatted.attachment).to.equal(null);
      expect(formatted.delivery_status).to.equal('sent');
      expect(formatted.is_read).to.equal(true);
    });
  });
});
