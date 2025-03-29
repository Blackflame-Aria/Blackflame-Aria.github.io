import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, doc, updateDoc, arrayUnion, deleteDoc, increment } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

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
let currentCategory = 'all';
let currentSort = 'newest';

async function submitPost(message, parentId = null) {
    const nicknameInput = document.getElementById('nickname').value.trim();
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
            dislikes: 0,
            replies: [],
            postCount: parentId ? 0 : 1,
            category: currentCategory === 'all' ? null : currentCategory
        };

        if (parentId) postData.parentId = parentId;

        const docRef = await addDoc(collection(db, 'posts'), postData);

        if (parentId) {
            const parentRef = doc(db, 'posts', parentId);
            await updateDoc(parentRef, { replies: arrayUnion(docRef.id) });
        }
    } catch (error) {
        console.error('Error adding post: ', error);
    }
}

async function likePost(postId) {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { likes: increment(1) });
}

async function dislikePost(postId) {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { dislikes: increment(1) });
}

async function deletePost(postId) {
    if (document.getElementById('nickname').value !== 'AdminUser') {
        alert('Only admins can delete posts!');
        return;
    }
    await deleteDoc(doc(db, 'posts', postId));
}

function showProfile(nickname, avatar, postCount) {
    alert(`Profile\nNickname: ${nickname}\nAvatar: ${avatar}\nPosts: ${postCount}`);
}

function toggleReplies(postId) {
    const repliesDiv = document.getElementById(`replies-${postId}`);
    const toggleButton = document.getElementById(`toggle-replies-${postId}`);
    if (repliesDiv.style.display === 'none') {
        repliesDiv.style.display = 'block';
        toggleButton.innerHTML = 'Hide replies ▲';
    } else {
        repliesDiv.style.display = 'none';
        toggleButton.innerHTML = 'Show replies ▼';
    }
}

function filterPosts() {
    // First filter by category
    if (currentCategory === 'all') {
        filteredPosts = [...allPosts];
    } else {
        filteredPosts = allPosts.filter(post => 
            post.category === currentCategory || 
            (post.parentId && allPosts.find(p => p.id === post.parentId)?.category === currentCategory)
        );
    }

    // Then apply sorting
    sortPosts(currentSort, false);
}

function sortPosts(sortType, updateDisplay = true) {
    currentSort = sortType;
    
    // Update button states
    document.querySelectorAll('.sort-options button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(sortType) || 
            (sortType === 'newest' && btn.textContent === 'Newest')) {
            btn.classList.add('active');
        }
    });
    
    switch(sortType) {
        case 'highest':
            filteredPosts.sort((a, b) => {
                const aScore = (a.likes || 0) - (a.dislikes || 0);
                const bScore = (b.likes || 0) - (b.dislikes || 0);
                return bScore - aScore;
            });
            break;
            
        case 'lowest':
            filteredPosts.sort((a, b) => {
                const aScore = (a.likes || 0) - (a.dislikes || 0);
                const bScore = (b.likes || 0) - (b.dislikes || 0);
                return aScore - bScore;
            });
            break;
            
        case 'replies':
            filteredPosts.sort((a, b) => {
                const aReplies = a.replies ? a.replies.length : 0;
                const bReplies = b.replies ? b.replies.length : 0;
                return bReplies - aReplies;
            });
            break;
            
        default: // 'newest'
            filteredPosts.sort((a, b) => {
                return b.timestamp?.toDate().getTime() - a.timestamp?.toDate().getTime();
            });
    }
    
    if (updateDisplay) {
        currentPage = 1;
        displayPosts();
    }
}

function setupCategoryButtons() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            document.getElementById('current-category-display').textContent = `/${currentCategory}/`;
            filterPosts();
            displayPosts();
        });
    });
}

const postsContainer = document.getElementById('posts');
const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
onSnapshot(q, (snapshot) => {
    allPosts = [];
    snapshot.forEach((doc) => {
        const post = doc.data();
        post.likes = post.likes || 0;
        post.dislikes = post.dislikes || 0;
        post.replies = post.replies || [];
        allPosts.push({ ...post, id: doc.id });
    });
    filterPosts();
    displayPosts();
});

function displayPosts() {
    postsContainer.innerHTML = '';
    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const paginatedPosts = filteredPosts.slice(start, end);

    const postsMap = {};
    filteredPosts.forEach(post => {
        post.replies = post.replies || [];
        postsMap[post.id] = post;
    });

    const buildPostHTML = (post, depth = 0) => {
        const indent = depth * 20;
        const isAdmin = document.getElementById('nickname').value === 'AdminUser';
        const avatarName = post.avatar.split('.')[0];
        const netScore = (post.likes || 0) - (post.dislikes || 0);
        const scoreSymbol = netScore > 0 ? '❤️' : (netScore < 0 ? '💩' : '♡');
        const voteButtons = !post.parentId ? `
            <button onclick="likePost('${post.id}')"><span class="heart">❤️</span></button>
            <button onclick="dislikePost('${post.id}')"><span class="poop">💩</span></button>
            <span class="net-score">${scoreSymbol} (${netScore})</span>
        ` : '';
        const repliesHtml = post.replies.length > 0 ? `
            <button class="toggle-replies-btn" onclick="toggleReplies('${post.id}')">
                <span id="toggle-replies-${post.id}">Show replies ▼</span>
            </button>
            <div id="replies-${post.id}" class="replies" style="display: none;">
                ${post.replies.map(replyId => postsMap[replyId] ? buildPostHTML(postsMap[replyId], depth + 1) : '').join('')}
            </div>
        ` : '';
        return `
            <div id="post-${post.id}" class="post ${avatarName}" style="margin-left: ${indent}px;">
                <img src="assets/${post.avatar}" alt="Avatar">
                <div class="post-content ${avatarName}">
                    <div class="nickname" onclick="showProfile('${post.nickname}', '${post.avatar}', ${post.postCount || 0})">${post.nickname}</div>
                    ${post.category ? `<div class="post-category">/${post.category}/</div>` : ''}
                    <div class="message">${post.message}</div>
                    <div class="timestamp">${post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Just now'}</div>
                    <div class="actions">
                        ${voteButtons}
                        ${!post.parentId ? `<button onclick="showReplyForm('${post.id}')">Reply</button>` : ''}
                        ${isAdmin ? `<button onclick="deletePost('${post.id}')">Delete</button>` : ''}
                    </div>
                    <div id="reply-form-${post.id}" class="reply-form" style="display: none;">
                        <textarea placeholder="Write a reply..."></textarea>
                        <button onclick="submitReply('${post.id}')">Post Reply</button>
                    </div>
                    ${repliesHtml}
                </div>
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

// Initialize
setupCategoryButtons();
document.querySelector('.category-btn[data-category="all"]').classList.add('active');

window.submitPost = function() {
    const message = document.getElementById('message').value.trim();
    submitPost(message);
    document.getElementById('message').value = '';
};

window.submitReply = async function(parentId) {
    const replyTextarea = document.querySelector(`#reply-form-${parentId} textarea`);
    const replyText = replyTextarea.value.trim();
    if (replyText === '') return;
    await submitPost(replyText, parentId);
    replyTextarea.value = '';
    document.getElementById(`reply-form-${parentId}`).style.display = 'none';
};

window.likePost = likePost;
window.dislikePost = dislikePost;
window.deletePost = deletePost;
window.showProfile = showProfile;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.showReplyForm = showReplyForm;
window.toggleReplies = toggleReplies;
window.sortPosts = sortPosts;