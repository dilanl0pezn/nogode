import {
  Ok,
  Err,
  Result,
  AsyncResult,
  tryAsync,
  chain,
  chainAsync,
  map,
  mapAsync,
  combine,
  combineAsync,
  ValidationError,
  NotFoundError,
  ExternalServiceError,
  ConflictError,
  initializeLogger,
  wrapError,
} from '../src';

// Initialize logger
const logger = initializeLogger({ prettify: true, level: 'debug' });

// ===== Domain Models =====
interface User {
  id: string;
  email: string;
  name: string;
  verified: boolean;
}

interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  publishedAt?: Date;
}

// ===== Simulated Database =====
const userDb = new Map<string, User>([
  ['1', { id: '1', email: 'john@example.com', name: 'John Doe', verified: true }],
  ['2', { id: '2', email: 'jane@example.com', name: 'Jane Smith', verified: false }],
]);

const postDb = new Map<string, Post>([
  ['1', { id: '1', userId: '1', title: 'First Post', content: 'Hello World!' }],
  ['2', { id: '2', userId: '1', title: 'Second Post', content: 'More content' }],
]);

// ===== Repository Layer =====
class UserRepository {
  async findById(id: string): AsyncResult<User, Error> {
    return tryAsync(async () => {
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate DB delay
      
      const user = userDb.get(id);
      if (!user) {
        throw new NotFoundError('User not found', { metadata: { userId: id } });
      }
      
      return user;
    });
  }

  async findByEmail(email: string): AsyncResult<User, Error> {
    return tryAsync(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const user = Array.from(userDb.values()).find(u => u.email === email);
      if (!user) {
        throw new NotFoundError('User not found', { metadata: { email } });
      }
      
      return user;
    });
  }

  async create(data: Omit<User, 'id'>): AsyncResult<User, Error> {
    return tryAsync(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check if email already exists
      const existing = Array.from(userDb.values()).find(u => u.email === data.email);
      if (existing) {
        throw new ConflictError('Email already exists', {
          metadata: { email: data.email },
        });
      }
      
      const user: User = {
        id: String(userDb.size + 1),
        ...data,
      };
      
      userDb.set(user.id, user);
      logger.info('User created', { userId: user.id });
      
      return user;
    });
  }
}

class PostRepository {
  async findByUserId(userId: string): AsyncResult<Post[], Error> {
    return tryAsync(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const posts = Array.from(postDb.values()).filter(p => p.userId === userId);
      return posts;
    });
  }

  async create(data: Omit<Post, 'id'>): AsyncResult<Post, Error> {
    return tryAsync(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const post: Post = {
        id: String(postDb.size + 1),
        ...data,
      };
      
      postDb.set(post.id, post);
      logger.info('Post created', { postId: post.id, userId: data.userId });
      
      return post;
    });
  }
}

// ===== Service Layer =====
class UserService {
  constructor(
    private userRepo: UserRepository,
    private postRepo: PostRepository
  ) {}

  // Example 1: Simple validation and chaining
  async createUser(email: string, name: string): AsyncResult<User, Error> {
    // Validate input
    if (!email || !email.includes('@')) {
      return Err(new ValidationError('Invalid email format'));
    }
    
    if (!name || name.length < 2) {
      return Err(new ValidationError('Name must be at least 2 characters'));
    }

    // Create user
    return this.userRepo.create({
      email,
      name,
      verified: false,
    });
  }

  // Example 2: Chaining operations
  async getUserWithPosts(userId: string): AsyncResult<User & { posts: Post[] }, Error> {
    // First get the user
    const userResult = await this.userRepo.findById(userId);
    
    // Then chain to get posts
    return chainAsync(userResult, async (user) => {
      const [posts, err] = await this.postRepo.findByUserId(user.id);
      
      if (err) {
        return Err(err);
      }
      
      return Ok({ ...user, posts });
    });
  }

  // Example 3: Mapping results
  async getUserSummary(userId: string): AsyncResult<string, Error> {
    const userWithPosts = await this.getUserWithPosts(userId);
    
    return mapAsync(userWithPosts, (user) => {
      return `${user.name} (${user.email}) has ${user.posts.length} posts`;
    });
  }

  // Example 4: Combining multiple async operations
  async getUsersByIds(userIds: string[]): AsyncResult<User[], Error> {
    logger.debug('Fetching multiple users', { count: userIds.length });
    
    const results = userIds.map(id => this.userRepo.findById(id));
    const [users, err] = await combineAsync(results);
    
    if (err) {
      logger.error('Failed to fetch users', { error: err.message });
      return Err(err);
    }
    
    logger.info('Users fetched successfully', { count: users.length });
    return Ok(users);
  }

  // Example 5: Error transformation
  async getVerifiedUser(userId: string): AsyncResult<User, Error> {
    const [user, err] = await this.userRepo.findById(userId);
    
    if (err) {
      return Err(
        wrapError(err, 'Failed to retrieve verified user', {
          metadata: { userId },
        })
      );
    }
    
    if (!user.verified) {
      return Err(
        new ValidationError('User is not verified', {
          metadata: { userId, verified: user.verified },
        })
      );
    }
    
    return Ok(user);
  }

  // Example 6: Complex business logic with multiple validations
  async createPostForUser(
    userId: string,
    title: string,
    content: string
  ): AsyncResult<Post, Error> {
    // Validate input
    if (!title || title.length < 5) {
      return Err(new ValidationError('Title must be at least 5 characters'));
    }
    
    if (!content || content.length < 10) {
      return Err(new ValidationError('Content must be at least 10 characters'));
    }

    // Check if user exists and is verified
    const [user, userErr] = await this.getVerifiedUser(userId);
    
    if (userErr) {
      return Err(userErr);
    }

    // Create the post
    const [post, postErr] = await this.postRepo.create({
      userId: user.id,
      title,
      content,
    });
    
    if (postErr) {
      return Err(
        wrapError(postErr, 'Failed to create post', {
          metadata: { userId, title },
        })
      );
    }

    logger.info('Post created for verified user', {
      postId: post.id,
      userId: user.id,
      userName: user.name,
    });

    return Ok(post);
  }

  // Example 7: External API call with error handling
  async syncUserWithExternalService(userId: string): AsyncResult<boolean, Error> {
    const [user, err] = await this.userRepo.findById(userId);
    
    if (err) {
      return Err(err);
    }

    // Simulate external API call
    return tryAsync(async () => {
      const response = await fetch('https://api.example.com/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        throw new ExternalServiceError('External sync failed', {
          statusCode: response.status,
          metadata: { userId, responseStatus: response.status },
        });
      }

      logger.info('User synced with external service', { userId });
      return true;
    });
  }
}

// ===== Usage Examples =====
async function examples() {
  const userRepo = new UserRepository();
  const postRepo = new PostRepository();
  const userService = new UserService(userRepo, postRepo);

  console.log('=== Example 1: Create User ===');
  const [newUser, createErr] = await userService.createUser(
    'alice@example.com',
    'Alice Johnson'
  );
  if (createErr) {
    logger.logError(createErr);
  } else {
    console.log('Created user:', newUser);
  }

  console.log('\n=== Example 2: Get User With Posts ===');
  const [userWithPosts, postsErr] = await userService.getUserWithPosts('1');
  if (postsErr) {
    logger.logError(postsErr);
  } else {
    console.log('User with posts:', userWithPosts);
  }

  console.log('\n=== Example 3: Get User Summary ===');
  const [summary, summaryErr] = await userService.getUserSummary('1');
  if (summaryErr) {
    logger.logError(summaryErr);
  } else {
    console.log('Summary:', summary);
  }

  console.log('\n=== Example 4: Get Multiple Users ===');
  const [users, usersErr] = await userService.getUsersByIds(['1', '2']);
  if (usersErr) {
    logger.logError(usersErr);
  } else {
    console.log('Users:', users.map(u => u.name));
  }

  console.log('\n=== Example 5: Get Verified User (should fail) ===');
  const [verifiedUser, verifiedErr] = await userService.getVerifiedUser('2');
  if (verifiedErr) {
    logger.logError(verifiedErr);
  } else {
    console.log('Verified user:', verifiedUser);
  }

  console.log('\n=== Example 6: Create Post ===');
  const [post, postErr] = await userService.createPostForUser(
    '1',
    'My New Post',
    'This is a great post with lots of content!'
  );
  if (postErr) {
    logger.logError(postErr);
  } else {
    console.log('Created post:', post);
  }

  console.log('\n=== Example 7: Validation Error ===');
  const [invalidPost, invalidErr] = await userService.createPostForUser(
    '1',
    'Bad',
    'Too short'
  );
  if (invalidErr) {
    logger.logError(invalidErr);
  } else {
    console.log('Created post:', invalidPost);
  }
}

// Run examples
if (require.main === module) {
  examples()
    .then(() => console.log('\n✅ All examples completed'))
    .catch(console.error);
}
