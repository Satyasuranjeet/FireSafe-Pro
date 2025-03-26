from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import google.generativeai as genai
import os
from flask_cors import CORS
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson.objectid import ObjectId
import json
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# Updated CORS configuration to explicitly allow all origins
CORS(app, resources={r"/*": {"origins": "*"}})

# Configuration
app.config['MONGO_URI'] = os.getenv('MONGO_URI')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

# Initialize extensions
mongo = PyMongo(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

@app.route('/api/verify-token', methods=['GET'])
@jwt_required()
def verify_token():
    try:
        current_user = get_jwt_identity()
        user = mongo.db.users.find_one({'_id': ObjectId(current_user)})
        if not user:
            return jsonify({'status': 'error', 'message': 'User not found'}), 404
        
        user_data = {
            '_id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'mobile': user['mobile'],
            'role': user['role']
        }
        return jsonify({'status': 'success', 'user': user_data}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/register', methods=['POST'])
@cross_origin()
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        mobile = data.get('mobile')
        password = data.get('password')
        role = data.get('role', 'Trainee')

        if not name or not email or not mobile or not password:
            return jsonify({'status': 'error', 'message': 'All fields are required'}), 400

        existing_user = mongo.db.users.find_one({'email': email})
        if existing_user:
            return jsonify({'status': 'error', 'message': 'Email already registered'}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = {
            'name': name,
            'email': email,
            'mobile': mobile,
            'password': hashed_password,
            'role': role,
            'created_at': datetime.utcnow()
        }

        result = mongo.db.users.insert_one(new_user)
        user = {
            '_id': str(result.inserted_id),
            'name': name,
            'email': email,
            'mobile': mobile,
            'role': role
        }
        access_token = create_access_token(identity=str(result.inserted_id))

        return jsonify({
            'status': 'success',
            'message': 'User registered successfully',
            'user': user,
            'access_token': access_token
        }), 201
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Registration failed: {str(e)}'
        }), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'status': 'error', 'message': 'Email and password are required'}), 400

        user = mongo.db.users.find_one({'email': email})
        if not user or not bcrypt.check_password_hash(user['password'], password):
            return jsonify({'status': 'error', 'message': 'Invalid email or password'}), 401

        access_token = create_access_token(identity=str(user['_id']))
        user_data = {
            '_id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'mobile': user['mobile'],
            'role': user['role']
        }
        return jsonify({
            'status': 'success',
            'message': 'Logged in successfully',
            'user': user_data,
            'access_token': access_token
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Login failed: {str(e)}'
        }), 500

@app.route('/api/generate-module-content', methods=['POST'])
@jwt_required()
def generate_module_content():
    try:
        data = request.get_json()
        module_title = data.get('moduleTitle')
        
        # Generate reading document
        reading_prompt = f"""Create a comprehensive educational document about {module_title} for fire safety training. 
        Include the following sections:
        1. Introduction
        2. Key Learning Objectives
        3. Detailed Explanation of Core Concepts
        4. Practical Applications
        5. Safety Considerations
        6. Summary
        
        Format the content with clear headings and bullet points where appropriate.
        Write in a professional training style suitable for fire safety professionals."""
        
        reading_response = model.generate_content(reading_prompt)
        
        # Generate MCQ Assignment
        mcq_prompt = f"""Create a multiple-choice quiz with 10 challenging questions about {module_title} for fire safety training. 
        Each question should have 4 options with only one correct answer. 
        Ensure the questions cover different aspects of the topic and vary in difficulty.
        
        Provide the output in the following JSON format:
        {{
          "quiz": [
            {{
              "question": "Question text?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer": "Correct option"
            }},
            // more questions...
          ]
        }}"""
        
        mcq_response = model.generate_content(mcq_prompt)
        
        # try:
        #     # Try to parse the MCQ response to validate it's proper JSON
        #     # mcq_json = json.loads(mcq_response.text)
        #     # print(mcq_json)
        #     # mcq_str = json.dumps(mcq_json) 
        #     #  # Convert back to string for storage
        # except json.JSONDecodeError:
        #     # If parsing fails, return a basic structure
        #     mcq_str = json.dumps({
        #         "quiz": [
        #             {
        #                 "question": "Example question?",
        #                 "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        #                 "answer": "Option 1"
        #             }
        #         ]
        #     })
        
        return jsonify({
            'status': 'success',
            'reading_document': reading_response.text,
            'mcq_assignment': mcq_response.text
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Content generation failed: {str(e)}'
        }), 500

@app.route('/api/chat', methods=['POST'])
@jwt_required()
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message')
        
        if not user_message:
            return jsonify({'status': 'error', 'message': 'Message is required'}), 400
        
        prompt = f"""You are a fire safety training assistant. Provide clear, concise, and accurate answers to questions about fire safety.
        The user asks: {user_message}
        
        Respond in a professional and helpful manner, focusing on fire safety best practices, regulations, and training information.
        If the question is not related to fire safety, politely inform the user that you specialize in fire safety topics."""
        
        response = model.generate_content(prompt)
        
        return jsonify({
            'status': 'success',
            'response': response.text
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Chat failed: {str(e)}'
        }), 500

@app.route('/api/modules', methods=['POST'])
@jwt_required()
def create_module():
    try:
        data = request.get_json()
        new_module = {
            'title': data.get('title'),
            'reading_document': data.get('reading_document', ''),
            'videos': data.get('videos', []),
            'mcq_assignment': data.get('mcq_assignment', ''),
            'reading_time': data.get('reading_time', 5),
            'videos_time': data.get('videos_time', 5),
            'assignment_time': data.get('assignment_time', 10),
            'created_at': datetime.utcnow(),
            'trainees_progress': []
        }
        
        result = mongo.db.modules.insert_one(new_module)
        
        return jsonify({
            'status': 'success',
            'message': 'Module created successfully',
            'module_id': str(result.inserted_id)
        }), 201

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Module creation failed: {str(e)}'
        }), 500

@app.route('/api/modules', methods=['GET'])
@jwt_required()
def get_modules():
    try:
        user_id = get_jwt_identity()
        user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        
        if user['role'] == 'Admin':
            # For admin, return all modules
            modules = list(mongo.db.modules.find())
            formatted_modules = []
            for module in modules:
                formatted_module = {
                    'id': str(module['_id']),
                    'title': module['title'],
                    'reading_time': module.get('reading_time', 5),
                    'videos_time': module.get('videos_time', 5),
                    'assignment_time': module.get('assignment_time', 10)
                }
                formatted_modules.append(formatted_module)
        else:
            # For trainee, return modules with progress
            modules = list(mongo.db.modules.find())
            formatted_modules = []
            for module in modules:
                module_id = str(module['_id'])
                user_progress = next((
                    prog for prog in module.get('trainees_progress', []) 
                    if prog['user_id'] == user_id
                ), None)
                
                # Calculate progress
                progress = 0
                if user_progress:
                    completed_sections = 0
                    if user_progress.get('reading_completed', False):
                        completed_sections += 1
                    if user_progress.get('videos_completed', False):
                        completed_sections += 1
                    if user_progress.get('assignment_completed', False):
                        completed_sections += 1
                    progress = (completed_sections / 3) * 100
                
                formatted_module = {
                    'id': module_id,
                    'title': module['title'],
                    'progress': progress,
                    'completed': user_progress.get('assignment_completed', False) if user_progress else False
                }
                formatted_modules.append(formatted_module)
        
        return jsonify({
            'status': 'success',
            'modules': formatted_modules
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Modules retrieval failed: {str(e)}'
        }), 500

@app.route('/api/modules/<module_id>', methods=['GET'])
@jwt_required()
def get_module_details(module_id):
    try:
        module = mongo.db.modules.find_one({'_id': ObjectId(module_id)})
        
        if not module:
            return jsonify({'status': 'error', 'message': 'Module not found'}), 404
        
        return jsonify({
            'status': 'success',
            'module': {
                'id': str(module['_id']),
                'title': module['title'],
                'reading_document': module['reading_document'],
                'videos': module['videos'],
                'mcq_assignment': module['mcq_assignment'],
                'reading_time': module.get('reading_time', 5),
                'videos_time': module.get('videos_time', 5),
                'assignment_time': module.get('assignment_time', 10)
            }
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Module details retrieval failed: {str(e)}'
        }), 500

@app.route('/api/modules/<module_id>/progress', methods=['GET'])
@jwt_required()
def get_module_progress(module_id):
    try:
        user_id = get_jwt_identity()
        module = mongo.db.modules.find_one({'_id': ObjectId(module_id)})
        
        if not module:
            return jsonify({'status': 'error', 'message': 'Module not found'}), 404
        
        user_progress = next((
            prog for prog in module.get('trainees_progress', []) 
            if prog['user_id'] == user_id
        ), None)
        
        progress = {
            'reading': user_progress.get('reading_completed', False) if user_progress else False,
            'videos': user_progress.get('videos_completed', False) if user_progress else False,
            'assignment': user_progress.get('assignment_completed', False) if user_progress else False
        }
        
        return jsonify({
            'status': 'success',
            'progress': progress
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Progress retrieval failed: {str(e)}'
        }), 500

@app.route('/api/modules/<module_id>/complete-section', methods=['POST'])
@jwt_required()
def complete_section(module_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        section = data.get('section')
        
        if section not in ['reading', 'videos', 'assignment']:
            return jsonify({'status': 'error', 'message': 'Invalid section'}), 400
        
        # Check if module exists
        module = mongo.db.modules.find_one({'_id': ObjectId(module_id)})
        if not module:
            return jsonify({'status': 'error', 'message': 'Module not found'}), 404
        
        # Find or create user progress
        user_progress = next((
            prog for prog in module.get('trainees_progress', []) 
            if prog['user_id'] == user_id
        ), None)
        
        update_field = f"{section}_completed"
        
        if user_progress:
            # Update existing progress
            mongo.db.modules.update_one(
                {'_id': ObjectId(module_id), 'trainees_progress.user_id': user_id},
                {'$set': {f'trainees_progress.$.{update_field}': True}}
            )
        else:
            # Create new progress entry
            new_progress = {
                'user_id': user_id,
                'reading_completed': section == 'reading',
                'videos_completed': section == 'videos',
                'assignment_completed': section == 'assignment',
                'attempts': []
            }
            mongo.db.modules.update_one(
                {'_id': ObjectId(module_id)},
                {'$push': {'trainees_progress': new_progress}}
            )
        
        return jsonify({
            'status': 'success',
            'message': f'Section {section} marked as completed'
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to complete section: {str(e)}'
        }), 500

@app.route('/api/modules/<module_id>/submit-assignment', methods=['POST'])
@jwt_required()
def submit_assignment(module_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        user_answers = data.get('answers', [])

        # Retrieve module details
        module = mongo.db.modules.find_one({'_id': ObjectId(module_id)})
        if not module:
            return jsonify({'status': 'error', 'message': 'Module not found'}), 404

        # Parse MCQ assignment JSON
        mcq_assignment = json.loads(module.get('mcq_assignment', '{}'))
        if not mcq_assignment or 'quiz' not in mcq_assignment:
            return jsonify({'status': 'error', 'message': 'MCQ assignment not available'}), 400

        questions = mcq_assignment['quiz']
        correct_count = sum(1 for i, q in enumerate(questions) 
                          if i < len(user_answers) and user_answers[i] == q['answer'])
        total_questions = len(questions)
        score_percentage = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        passed = score_percentage >= 70

        # Find user progress
        user_progress = next((
            prog for prog in module.get('trainees_progress', []) 
            if prog['user_id'] == user_id
        ), None)
        
        attempt = {
            'timestamp': datetime.utcnow(),
            'score': score_percentage,
            'passed': passed
        }
        
        if user_progress:
            # Update existing progress with new attempt
            mongo.db.modules.update_one(
                {'_id': ObjectId(module_id), 'trainees_progress.user_id': user_id},
                {
                    '$push': {'trainees_progress.$.attempts': attempt},
                    '$set': {
                        'trainees_progress.$.assignment_completed': True,
                        'trainees_progress.$.last_score': score_percentage,
                        'trainees_progress.$.passed': passed
                    }
                }
            )
        else:
            # Create new progress entry
            new_progress = {
                'user_id': user_id,
                'reading_completed': False,
                'videos_completed': False,
                'assignment_completed': True,
                'last_score': score_percentage,
                'passed': passed,
                'attempts': [attempt]
            }
            mongo.db.modules.update_one(
                {'_id': ObjectId(module_id)},
                {'$push': {'trainees_progress': new_progress}}
            )
        
        return jsonify({
            'status': 'success',
            'score': score_percentage,
            'passed': passed,
            'message': 'Assignment submitted successfully'
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/trainees', methods=['GET'])
@jwt_required()
def get_trainees():
    try:
        # Verify user is admin
        current_user = get_jwt_identity()
        user = mongo.db.users.find_one({'_id': ObjectId(current_user)})
        if user['role'] != 'Admin':
            return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
        
        # Get all modules with trainee progress
        modules = list(mongo.db.modules.find())
        
        # Get all trainees
        trainees = list(mongo.db.users.find({'role': 'Trainee'}))
        
        # Format trainee data with module progress
        formatted_trainees = []
        for trainee in trainees:
            trainee_data = {
                '_id': str(trainee['_id']),
                'name': trainee['name'],
                'email': trainee['email'],
                'modules': []
            }
            
            for module in modules:
                module_progress = next((
                    prog for prog in module.get('trainees_progress', []) 
                    if prog['user_id'] == str(trainee['_id'])
                ), None)
                
                if module_progress:
                    trainee_data['modules'].append({
                        'module_id': str(module['_id']),
                        'module_title': module['title'],
                        'attempts': module_progress.get('attempts', []),
                        'completed': module_progress.get('assignment_completed', False),
                        'last_score': module_progress.get('last_score', 0)
                    })
                else:
                    trainee_data['modules'].append({
                        'module_id': str(module['_id']),
                        'module_title': module['title'],
                        'attempts': [],
                        'completed': False,
                        'last_score': 0
                    })
            
            formatted_trainees.append(trainee_data)
        
        return jsonify({
            'status': 'success',
            'trainees': formatted_trainees
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Trainees retrieval failed: {str(e)}'
        }), 500

@app.route('/api/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    try:
        # Verify user is admin
        current_user = get_jwt_identity()
        user = mongo.db.users.find_one({'_id': ObjectId(current_user)})
        if user['role'] != 'Admin':
            return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
        
        # Aggregate progress across all modules
        leaderboard_pipeline = [
            {'$unwind': '$trainees_progress'},
            {'$match': {'trainees_progress.passed': True}},
            {'$group': {
                '_id': '$trainees_progress.user_id',
                'total_score': {'$avg': '$trainees_progress.last_score'},
                'modules_completed': {'$sum': 1}
            }},
            {'$sort': {'total_score': -1, 'modules_completed': -1}},
            {'$limit': 10},
            {'$lookup': {
                'from': 'users',
                'localField': '_id',
                'foreignField': '_id',
                'as': 'user'
            }},
            {'$unwind': '$user'},
            {'$project': {
                '_id': 1,
                'name': '$user.name',
                'score': {'$round': ['$total_score', 2]},
                'modules_completed': 1
            }}
        ]
        
        leaderboard = list(mongo.db.modules.aggregate(leaderboard_pipeline))
        
        return jsonify({
            'status': 'success',
            'leaderboard': leaderboard
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Leaderboard retrieval failed: {str(e)}'
        }), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))  # Render assigns a dynamic port
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_DEBUG', False))