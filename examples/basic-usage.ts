import {
  Ok,
  Err,
  tryAsync,
  wrapPromise,
  chain,
  combine,
  unwrap,
  unwrapOr,
  ValidationError,
  NotFoundError,
  initializeLogger,
} from '../src';

// Initialize logger
const logger = initializeLogger({ prettify: true });

// Example 1: Basic Result usage
async function findUser(id: string) {
  if (!id) {
    return Err(new ValidationError('User ID is required'));
  }

  // Simulate database call
  const user = { id, name: 'John Doe', email: 'john@example.com' };
  
  if (id === 'notfound') {
    return Err(new NotFoundError('User not found'));
  }

  return Ok(user);
}

// Example 2: Using tryAsync
async function fetchUserData(userId: string) {
  const [user, err] = await findUser(userId);
  
  if (err) {
    logger.logError(err);
    return Err(err);
  }

  logger.info('User found', { userId: user.id });
  return Ok(user);
}

// Example 3: Chaining operations
async function getUserWithPosts(userId: string) {
  return chain(
    await findUser(userId),
    (user) => {
      // Simulate fetching posts
      const posts = [
        { id: '1', title: 'First post' },
        { id: '2', title: 'Second post' },
      ];
      return Ok({ ...user, posts });
    }
  );
}

// Example 4: Combining multiple operations
async function getUsersData(userIds: string[]) {
  const results = userIds.map(id => findUser(id));
  return combine(await Promise.all(results));
}

// Example 5: Wrapping external promises
async function externalApiCall() {
  const result = await wrapPromise(
    fetch('https://api.example.com/data').then(r => r.json())
  );

  const [data, err] = result;
  if (err) {
    logger.logError(err);
    return Err(err);
  }

  return Ok(data);
}

// Example 6: Using unwrap and unwrapOr
async function getUser(id: string) {
  const result = await findUser(id);
  
  // Using unwrap (throws if error)
  try {
    const user = unwrap(result);
    console.log('User:', user);
  } catch (error) {
    console.error('Error:', error);
  }

  // Using unwrapOr (returns default)
  const user = unwrapOr(result, { id: 'default', name: 'Guest', email: '' });
  console.log('User or default:', user);
}

// Main execution
async function main() {
  console.log('=== Example 1: Basic Result ===');
  const result1 = await fetchUserData('123');
  console.log('Result:', result1);

  console.log('\n=== Example 2: Not Found ===');
  const result2 = await fetchUserData('notfound');
  console.log('Result:', result2);

  console.log('\n=== Example 3: Chaining ===');
  const result3 = await getUserWithPosts('123');
  console.log('Result:', result3);

  console.log('\n=== Example 4: Combining ===');
  const result4 = await getUsersData(['123', '456']);
  console.log('Result:', result4);

  console.log('\n=== Example 5: Unwrap ===');
  await getUser('123');
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}
