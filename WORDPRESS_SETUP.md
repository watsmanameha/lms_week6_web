# WordPress Setup Instructions

## For Local Development

1. Start WordPress with Docker:
```bash
docker-compose up -d
```

2. Access WordPress at http://localhost:8080 and complete the installation:
   - Site Title: Any name
   - Username: admin
   - Password: (choose a strong password)
   - Email: your email

3. After installation, create a post with ID 1:
   - Go to Posts → Add New
   - Title: Your login (e.g., `c23defe5-07d3-4de0-b01a-32c82d7fcfc1`)
   - Content: Any content
   - Publish the post

4. The post should be accessible via the API at:
   `http://localhost:3000/wordpress/wp-json/wp/v2/posts/1`

## For Production Deployment (e.g., Render.com)

Since Render.com doesn't support Docker directly, you have several options:

### Option 1: Deploy WordPress Separately
1. Deploy WordPress on a separate service (e.g., WordPress.com, another Render.com web service with WordPress, or any WordPress hosting)
2. Set the `WORDPRESS_URL` environment variable in your Render.com dashboard to point to your WordPress instance
   Example: `WORDPRESS_URL=https://your-wordpress-site.com`

### Option 2: Use a WordPress Hosting Service
1. Use services like:
   - WordPress.com
   - InfinityFree (free WordPress hosting)
   - 000webhost (free WordPress hosting)
2. After setting up WordPress, create a post with your login as the title
3. Set the `WORDPRESS_URL` environment variable to your WordPress site URL

### Creating the Required Post
After WordPress is set up, you need to create a post with ID 1:

1. Log in to WordPress admin dashboard
2. Go to Posts → All Posts
3. If there's already a "Hello World" post, edit it:
   - Change the title to your login value
   - Publish/Update
4. If there's no post, create a new one:
   - Title: Your login (the value from `/login/` endpoint)
   - Content: Any content
   - Publish

5. Verify the post is accessible via API:
   `YOUR_APP_URL/wordpress/wp-json/wp/v2/posts/1`

## Testing

Test that the WordPress proxy works:
```bash
# Get post with ID 1
curl http://localhost:3000/wordpress/wp-json/wp/v2/posts/1

# Should return JSON with the post data including title field with your login
```