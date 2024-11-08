import React from 'react'

const ProfilePosts = () => {
  return (
    <div class="comment-section">
    <h3 class="comment-section-title">Comments</h3>

    <div class="comment-input-container">
        <textarea placeholder="Write a comment..." rows="4"></textarea>
        <button class="comment-submit-btn">Post Comment</button>
    </div>

    <div class="comment-list">
  
        <div class="comment">
            <div class="comment-body">
                <div class="comment-header">
                    <span class="comment-author">JohnDoe</span> 
                    <span class="comment-time">2 hours ago</span>
                </div>
                <p class="comment-text">Great profile! I love your achievements in Dota 2!</p>
                <div class="comment-actions">
                    <button class="like-btn">
                        <span class="like-count">5</span> Like
                    </button>
                    <button class="reply-btn">Reply</button>
                </div>
            </div>
        </div>

    </div>
</div>

  )
}

export default ProfilePosts