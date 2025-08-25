import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import bcrypt
import jwt
from datetime import datetime, timedelta

# 加载环境变量
load_dotenv()

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# JWT配置
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
app.config['JWT_EXPIRATION_DELTA'] = 24  # 小时


# 数据库连接函数
def get_db_connection():
    conn = psycopg2.connect(
        os.getenv("DATABASE_URL"),
        cursor_factory=RealDictCursor
    )
    conn.autocommit = False
    return conn

# 在app.py中添加
def init_db():
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # 创建用户表
        cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
        ''')
        conn.commit()
        print("数据库表初始化成功")
    except Exception as e:
        print(f"初始化数据库错误: {e}")
    finally:
        conn.close()



# 注册接口
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    if not all(k in data for k in ('username', 'password')):
        return jsonify({'message': '用户名和密码不能为空'}), 400

    username = data['username']
    password = data['password'].encode('utf-8')
    email = data.get('email', '')

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # 检查用户名是否已存在
        cur.execute('SELECT id FROM users WHERE username = %s', (username,))
        if cur.fetchone():
            return jsonify({'message': '用户名已存在'}), 400

        # 密码加密
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password, salt)

        # 插入新用户
        cur.execute(
            'INSERT INTO users (username, password, email, created_at) VALUES (%s, %s, %s, CURRENT_TIMESTAMP) RETURNING id, username, email',
            (username, hashed_password.decode('utf-8'), email)
        )
        user = cur.fetchone()
        conn.commit()

        return jsonify({
            'message': '注册成功',
            'user': user
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"注册错误: {str(e)}")
        return jsonify({'message': '服务器错误'}), 500
    finally:
        if conn:
            conn.close()


# 登录接口
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    if not all(k in data for k in ('username', 'password')):
        return jsonify({'message': '用户名和密码不能为空'}), 400

    username = data['username']
    password = data['password'].encode('utf-8')

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # 查询用户
        cur.execute('SELECT * FROM users WHERE username = %s', (username,))
        user = cur.fetchone()

        if not user:
            return jsonify({'message': '用户名或密码错误'}), 400

        # 验证密码
        if not bcrypt.checkpw(password, user['password'].encode('utf-8')):
            return jsonify({'message': '用户名或密码错误'}), 400

        # 更新最后登录时间
        cur.execute(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = %s',
            (user['id'],)
        )
        conn.commit()

        # 生成JWT令牌
        expiration = datetime.utcnow() + timedelta(hours=app.config['JWT_EXPIRATION_DELTA'])
        token = jwt.encode({
            'id': user['id'],
            'username': user['username'],
            'exp': expiration
        }, app.config['JWT_SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'message': '登录成功',
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email']
            }
        })

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"登录错误: {str(e)}")
        return jsonify({'message': '服务器错误'}), 500
    finally:
        if conn:
            conn.close()


# 验证登录状态接口
@app.route('/api/verify', methods=['GET'])
def verify_token():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')

    if not token:
        return jsonify({'message': '未提供令牌', 'logged_in': False}), 401

    try:
        payload = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return jsonify({
            'logged_in': True,
            'user': {
                'id': payload['id'],
                'username': payload['username']
            }
        })
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '令牌已过期', 'logged_in': False}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': '无效的令牌', 'logged_in': False}), 401


if __name__ == '__main__':
    app.run(debug=True, port=3001)