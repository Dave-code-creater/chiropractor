const { SuccessResponse, ErrorResponse } = require('../utils/httpResponses');
const { getPostgreSQLPool } = require('../config/database');
const { createConversationSchema, doctorPatientConversationSchema, sendMessageSchema } = require('../validators');

class ChatController {
  static async createConversation(req, res) {
    try {
      console.log('Creating conversation:', { title: req.body?.title });

      // Validate request body
      const { error, value } = createConversationSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const {
        doctor_id, patient_id, title, description, participant_type, initial_message
      } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Begin transaction
        await client.query('BEGIN');

        // Verify participants exist if provided
        if (doctor_id) {
          const doctorCheck = await client.query(
            'SELECT id, first_name, last_name FROM doctors WHERE id = $1 AND status = $2',
            [doctor_id, 'active']
          );

          if (doctorCheck.rows.length === 0) {
            throw new ErrorResponse('Doctor not found', 404, '4041');
          }
        }

        if (patient_id) {
          const patientCheck = await client.query(
            'SELECT id, first_name, last_name FROM patients WHERE id = $1 AND status = $2',
            [patient_id, 'active']
          );

          if (patientCheck.rows.length === 0) {
            throw new ErrorResponse('Patient not found', 404, '4042');
          }
        }

        // Generate conversation ID
        const conversation_id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Insert conversation
        const conversationResult = await client.query(
          `INSERT INTO conversations (
            conversation_id, doctor_id, patient_id, title, description, participant_type,
            status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
          RETURNING *`,
          [conversation_id, doctor_id, patient_id, title, description, participant_type]
        );

        const conversation = conversationResult.rows[0];

        // Add initial message if provided
        let initialMessageRecord = null;
        if (initial_message) {
          const messageResult = await client.query(
            `INSERT INTO messages (
              conversation_id, content, sender_type, sender_id, message_type, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, 'text', 'sent', NOW(), NOW())
            RETURNING *`,
            [conversation_id, initial_message, participant_type || 'user', patient_id || doctor_id]
          );

          initialMessageRecord = messageResult.rows[0];
        }

        // Commit transaction
        await client.query('COMMIT');

        console.log('Conversation created successfully:', { id: conversation.id, conversation_id });

        const response = new SuccessResponse('Conversation created successfully', 201, {
          conversation: {
            id: conversation.id,
            conversation_id: conversation.conversation_id,
            doctor_id: conversation.doctor_id,
            patient_id: conversation.patient_id,
            title: conversation.title,
            description: conversation.description,
            participant_type: conversation.participant_type,
            status: conversation.status,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at
          },
          initial_message: initialMessageRecord ? {
            id: initialMessageRecord.id,
            conversation_id: initialMessageRecord.conversation_id,
            content: initialMessageRecord.content,
            sender_type: initialMessageRecord.sender_type,
            sender_id: initialMessageRecord.sender_id,
            message_type: initialMessageRecord.message_type,
            status: initialMessageRecord.status,
            created_at: initialMessageRecord.created_at
          } : null
        });

        response.send(res);

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Conversation creation error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during conversation creation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async createDoctorPatientConversation(req, res) {
    try {
      console.log('Creating doctor-patient conversation:', { doctor_id: req.body?.doctor_id });

      // Validate request body
      const { error, value } = doctorPatientConversationSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const { doctor_id, patient_id, title, initial_message } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Begin transaction
        await client.query('BEGIN');

        // Verify doctor exists
        const doctorCheck = await client.query(
          'SELECT id, first_name, last_name FROM doctors WHERE id = $1 AND status = $2',
          [doctor_id, 'active']
        );

        if (doctorCheck.rows.length === 0) {
          throw new ErrorResponse('Doctor not found', 404, '4041');
        }

        const doctor = doctorCheck.rows[0];

        // Verify patient exists if provided
        let patient = null;
        if (patient_id) {
          const patientCheck = await client.query(
            'SELECT id, first_name, last_name FROM patients WHERE id = $1 AND status = $2',
            [patient_id, 'active']
          );

          if (patientCheck.rows.length === 0) {
            throw new ErrorResponse('Patient not found', 404, '4042');
          }

          patient = patientCheck.rows[0];
        }

        // Generate conversation ID
        const conversation_id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Insert conversation
        const conversationResult = await client.query(
          `INSERT INTO conversations (
            conversation_id, doctor_id, patient_id, title, participant_type,
            status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, 'doctor-patient', 'active', NOW(), NOW())
          RETURNING *`,
          [conversation_id, doctor_id, patient_id, title]
        );

        const conversation = conversationResult.rows[0];

        // Add initial message
        const messageResult = await client.query(
          `INSERT INTO messages (
            conversation_id, content, sender_type, sender_id, message_type, status, created_at, updated_at
          ) VALUES ($1, $2, 'patient', $3, 'text', 'sent', NOW(), NOW())
          RETURNING *`,
          [conversation_id, initial_message, patient_id]
        );

        const message = messageResult.rows[0];

        // Commit transaction
        await client.query('COMMIT');

        console.log('Doctor-patient conversation created successfully:', { 
          id: conversation.id, 
          conversation_id,
          doctor_id,
          patient_id
        });

        const response = new SuccessResponse('Doctor-patient conversation created successfully', 201, {
          conversation: {
            id: conversation.id,
            conversation_id: conversation.conversation_id,
            doctor_id: conversation.doctor_id,
            doctor_name: `${doctor.first_name} ${doctor.last_name}`,
            patient_id: conversation.patient_id,
            patient_name: patient ? `${patient.first_name} ${patient.last_name}` : null,
            title: conversation.title,
            participant_type: conversation.participant_type,
            status: conversation.status,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at
          },
          initial_message: {
            id: message.id,
            conversation_id: message.conversation_id,
            content: message.content,
            sender_type: message.sender_type,
            sender_id: message.sender_id,
            message_type: message.message_type,
            status: message.status,
            created_at: message.created_at
          }
        });

        response.send(res);

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Doctor-patient conversation creation error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during doctor-patient conversation creation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async sendMessage(req, res) {
    try {
      console.log('Sending message:', { conversation_id: req.body?.conversation_id });

      // Validate request body
      const { error, value } = sendMessageSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const {
        conversation_id, content, sender_type, sender_id, message_type, attachment_url
      } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Begin transaction
        await client.query('BEGIN');

        // Verify conversation exists
        const conversationCheck = await client.query(
          'SELECT id, status FROM conversations WHERE conversation_id = $1',
          [conversation_id]
        );

        if (conversationCheck.rows.length === 0) {
          throw new ErrorResponse('Conversation not found', 404, '4041');
        }

        const conversation = conversationCheck.rows[0];

        if (conversation.status !== 'active') {
          throw new ErrorResponse('Conversation is not active', 400, '4001');
        }

        // Insert message
        const messageResult = await client.query(
          `INSERT INTO messages (
            conversation_id, content, sender_type, sender_id, message_type, attachment_url,
            status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'sent', NOW(), NOW())
          RETURNING *`,
          [conversation_id, content, sender_type, sender_id, message_type, attachment_url]
        );

        const message = messageResult.rows[0];

        // Update conversation last activity
        await client.query(
          'UPDATE conversations SET updated_at = NOW() WHERE conversation_id = $1',
          [conversation_id]
        );

        // Commit transaction
        await client.query('COMMIT');

        console.log('Message sent successfully:', { 
          id: message.id, 
          conversation_id: message.conversation_id 
        });

        const response = new SuccessResponse('Message sent successfully', 201, {
          message: {
            id: message.id,
            conversation_id: message.conversation_id,
            content: message.content,
            sender_type: message.sender_type,
            sender_id: message.sender_id,
            message_type: message.message_type,
            attachment_url: message.attachment_url,
            status: message.status,
            created_at: message.created_at,
            updated_at: message.updated_at
          }
        });

        response.send(res);

        // Emit socket event if available
        if (req.app.locals.io) {
          req.app.locals.io.to(conversation_id).emit('new_message', {
            message: response.data.message
          });
        }

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Send message error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during message sending', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async getConversations(req, res) {
    try {
      const { doctor_id, patient_id, participant_type } = req.query;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        let query = `
          SELECT c.*, 
                 d.first_name as doctor_first_name, d.last_name as doctor_last_name,
                 p.first_name as patient_first_name, p.last_name as patient_last_name,
                 (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.conversation_id) as message_count,
                 (SELECT m.content FROM messages m WHERE m.conversation_id = c.conversation_id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                 (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.conversation_id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
          FROM conversations c
          LEFT JOIN doctors d ON c.doctor_id = d.id
          LEFT JOIN patients p ON c.patient_id = p.id
          WHERE c.status = 'active'
        `;

        const queryParams = [];
        let paramIndex = 1;

        if (doctor_id) {
          query += ` AND c.doctor_id = $${paramIndex}`;
          queryParams.push(parseInt(doctor_id));
          paramIndex++;
        }

        if (patient_id) {
          query += ` AND c.patient_id = $${paramIndex}`;
          queryParams.push(parseInt(patient_id));
          paramIndex++;
        }

        if (participant_type) {
          query += ` AND c.participant_type = $${paramIndex}`;
          queryParams.push(participant_type);
          paramIndex++;
        }

        query += ' ORDER BY c.updated_at DESC';

        const conversationsResult = await client.query(query, queryParams);

        const conversations = conversationsResult.rows.map(conv => ({
          id: conv.id,
          conversation_id: conv.conversation_id,
          doctor_id: conv.doctor_id,
          doctor_name: conv.doctor_first_name && conv.doctor_last_name 
            ? `${conv.doctor_first_name} ${conv.doctor_last_name}` 
            : null,
          patient_id: conv.patient_id,
          patient_name: conv.patient_first_name && conv.patient_last_name 
            ? `${conv.patient_first_name} ${conv.patient_last_name}` 
            : null,
          title: conv.title,
          description: conv.description,
          participant_type: conv.participant_type,
          status: conv.status,
          message_count: parseInt(conv.message_count),
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          created_at: conv.created_at,
          updated_at: conv.updated_at
        }));

        const response = new SuccessResponse('Conversations retrieved successfully', 200, {
          conversations,
          total_count: conversations.length
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Get conversations error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error while retrieving conversations', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async getMessages(req, res) {
    try {
      const { conversation_id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      if (!conversation_id) {
        throw new ErrorResponse('Conversation ID is required', 400, '4001');
      }

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Verify conversation exists
        const conversationCheck = await client.query(
          'SELECT id FROM conversations WHERE conversation_id = $1',
          [conversation_id]
        );

        if (conversationCheck.rows.length === 0) {
          throw new ErrorResponse('Conversation not found', 404, '4041');
        }

        // Get messages
        const messagesResult = await client.query(
          `SELECT * FROM messages 
           WHERE conversation_id = $1 
           ORDER BY created_at DESC 
           LIMIT $2 OFFSET $3`,
          [conversation_id, parseInt(limit), parseInt(offset)]
        );

        const messages = messagesResult.rows.reverse().map(message => ({
          id: message.id,
          conversation_id: message.conversation_id,
          content: message.content,
          sender_type: message.sender_type,
          sender_id: message.sender_id,
          message_type: message.message_type,
          attachment_url: message.attachment_url,
          status: message.status,
          created_at: message.created_at,
          updated_at: message.updated_at
        }));

        const response = new SuccessResponse('Messages retrieved successfully', 200, {
          messages,
          conversation_id,
          total_count: messages.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Get messages error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error while retrieving messages', 500, '5000');
        errorResponse.send(res);
      }
    }
  }
}

module.exports = ChatController; 