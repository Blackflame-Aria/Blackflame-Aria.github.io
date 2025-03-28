import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, doc, updateDoc, arrayUnion, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDvlWWO-y5JxQSJlOZ4M-7xGabuwoXhyVA",
    authDomain: "blackflame-forum.firebaseapp.com",
    projectId: "blackflame-forum",
    storageBucket: "blackflame-forum.firebasestorage.app",
    messagingSenderId: "595991414406",
    appId: "1:595991414406:web:6e605a0dfbdb3b756d3307",
    measurementId: "G-1X915SM39P"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentPage = 1;
const postsPerPage = 5;
let allPosts = [];
let filteredPosts = [];

// Submit a post
async function submitPost(parentId = null) {
    const nicknameInput = document.getElementById('nickname').value.trim();
    const message = document.getElementById('message').value.trim();
    const avatar = document.getElementById('avatar').value;
    const nickname = nicknameInput === '' ? 'Anonymous' : nicknameInput;

    if (message === '') return;

    try {
        const postData = {
            nickname: nickname,
            message: message,
            avatar: avatar,
            timestamp: serverTimestamp(),
            likes: 0,
            replies: [],
            postCount: parentId ? 0 : 1
        };

        if (parentId) postData.parentId = parentId;

        const docRef = await addDoc(collection(db, 'posts'), postData);

        if (parentId) {
            const parentRef = doc(db, 'posts', parentId);
            await updateDoc(parentRef, { replies: arrayUnion(docRef.id) });
            alert(`New reply to your post by ${nickname}!`);
        }

        document.getElementById('message').value = '';
        document.getElementById('avatar').value = 'pfp.png';
    } catch (error) {
        console.error('Error adding post: ', error);
    }
}

// Like a post
async function likePost(postId) {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { likes: firebase.firestore.FieldValue.increment(1) });
}

// Delete a post (admin only)
async function deletePost(postId) {
    if (document.getElementById('nickname').value !== 'AdminUser') {
        alert('Only admins can delete posts!');
        return;
    }
    await deleteDoc(doc(db, 'posts', postId));
}

// Show user profile
function showProfile(nickname, avatar, postCount) {
    alert(`Profile\nNickname: ${nickname}\nAvatar: ${avatar}\nPosts: ${postCount}`);
}

// Load and display posts
const postsContainer = document.getElementById('posts');
const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
onSnapshot(collection(db, 'posts'), (snapshot) => {
    const allPosts = [];
    snapshot.forEach((doc) => {
        const post = { ...doc.data(), id: doc.id };
        post.likes = post.likes || 0; // Default to 0 if undefined
        allPosts.push(post);
    });
    filterAndDisplayPosts();
});


function filterAndDisplayPosts(searchTerm = '') {
    filteredPosts = allPosts.filter(post => 
        post.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || 
        post.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
    displayPosts();
}

function displayPosts() {
    postsContainer.innerHTML = '';
    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const paginatedPosts = filteredPosts.slice(start, end);

    const postsMap = {};
    filteredPosts.forEach(post => postsMap[post.id] = post);

    const buildPostHTML = (post, depth = 0) => {
        const indent = depth * 20;
        const isAdmin = document.getElementById('nickname').value === 'AdminUser';
        const avatarName = post.avatar.split('.')[0];
        return `
            <div class="post ${avatarName}" style="margin-left: ${indent}px;">
                <img src="assets/${post.avatar}" alt="Avatar">
                <div class="post-content ${avatarName}">
                    <div class="nickname" onclick="showProfile('${post.nickname}', '${post.avatar}', ${post.postCount || 0})">${post.nickname}</div>
                    <div class="message">${post.message}</div>
                    <div class="timestamp">${post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Just now'}</div>
                    <div class="actions">
                        <button onclick="likePost('${post.id}')">Like (${post.likes})</button>
                        <button onclick="showReplyForm('${post.id}')">Reply</button>
                        ${isAdmin ? `<button onclick="deletePost('${post.id}')">Delete</button>` : ''}
                    </div>
                    <div id="reply-form-${post.id}" class="reply-form" style="display: none;">
                        <textarea placeholder="Write a reply..."></textarea>
                        <button onclick="submitReply('${post.id}')">Post Reply</button>
                    </div>
                </div>
                ${post.replies.map(replyId => buildPostHTML(postsMap[replyId], depth + 1)).join('')}
            </div>
        `;
    };

    paginatedPosts.filter(post => !post.parentId).forEach(post => {
        postsContainer.innerHTML += buildPostHTML(post);
    });

    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
}

function prevPage() {
    if (currentPage > 1) currentPage--;
    displayPosts();
}

function nextPage() {
    if (currentPage < Math.ceil(filteredPosts.length / postsPerPage)) currentPage++;
    displayPosts();
}

function showReplyForm(postId) {
    document.getElementById(`reply-form-${postId}`).style.display = 'block';
}

async function submitReply(parentId) {
    const replyText = document.querySelector(`#reply-form-${parentId} textarea`).value.trim();
    if (replyText === '') return;
    await submitPost(parentId);
    document.querySelector(`#reply-form-${parentId} textarea`).value = '';
    document.getElementById(`reply-form-${parentId}`).style.display = 'none';
}

// Attach functions to window for global access
window.submitPost = submitPost;
window.likePost = likePost;
window.deletePost = deletePost;
window.showProfile = showProfile;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.showReplyForm = showReplyForm;
window.submitReply = submitReply;