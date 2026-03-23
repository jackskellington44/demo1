// ============================================
// SUPABASE IMPORTS
// ============================================

import { supabase } from './supabase-config.js';

// ============================================
// DOM ELEMENT REFERENCES
// ============================================

const mainPageContainer = document.getElementById('mainPageContainer');
const postFeed = document.getElementById('postFeed');
const postFormOverlay = document.getElementById('postFormOverlay');
const postTitle = document.getElementById('postTitle');
const postCategory = document.getElementById('postCategory');
const postCategoryInput = document.getElementById('postCategoryInput');
const addCategoryToggle = document.getElementById('addCategoryToggle');
const postFileInput = document.getElementById('postFileInput');
const postFileName = document.getElementById('postFileName');
const postText = document.getElementById('postText');
const postSubmitBtn = document.getElementById('postSubmitBtn');
const postCancelBtn = document.getElementById('postCancelBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Cover image prompt
const coverImageOverlay = document.getElementById('coverImageOverlay');
const coverImageInput = document.getElementById('coverImageInput');
const coverImageFileName = document.getElementById('coverImageFileName');
const coverImageSubmitBtn = document.getElementById('coverImageSubmitBtn');
const coverImageSkipBtn = document.getElementById('coverImageSkipBtn');

// ============================================
// STATE VARIABLES
// ============================================

let currentUser = null;
let currentUserData = null;
let pendingPost = null;
let editMode = false;
let editingPostId = null; // When editing an existing post
let activeUserFilter = null;      // stores a user_id
let activeCategoryFilter = null;  // stores a category string
const NONE_CATEGORY_FILTER = '__NONE__';


// Double right-click detection
let lastRightClick = 0;
const DOUBLE_CLICK_THRESHOLD = 400; // ms


// ============================================
// 1. AUTH CHECK
// ============================================

async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = './index.html';
        return null;
    }

    currentUser = session.user;
    console.log('Logged in as:', currentUser.id);

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (error) {
        console.error('Failed to fetch user data:', error);
        return null;
    }

    currentUserData = data;
    console.log('User data loaded:', currentUserData.username);
    return session;
}

// ============================================
// 2. FILE TYPE DETECTION
// ============================================

function getFileType(file) {
    const mime = file.type;
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    return 'other';
}

function isVisualFile(file) {
    const type = getFileType(file);
    return type === 'image' || type === 'video';
}

// ============================================
// 3. RIGHT-CLICK HANDLING
// ============================================

function initializePostForm() {
        mainPageContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        const now = Date.now();
        const timeSince = now - lastRightClick;
        lastRightClick = now;

        const isFormOpen = postFormOverlay.style.display === 'flex';

        // Double right-click: toggle edit mode
        if (timeSince < DOUBLE_CLICK_THRESHOLD) {
            lastRightClick = 0; // Reset so third click doesn't re-trigger
            closePostForm();
            toggleEditMode();
            return;
        }

        // Single right-click behavior (delayed so we can detect double)
        setTimeout(() => {
            // If lastRightClick hasn't been reset (meaning no second click came)
            if (lastRightClick !== now) return;

            // If form is open: right-click closes it
            if (isFormOpen) {
                closePostForm();
                return;
            }

            // Otherwise open form (only when not in edit mode)
            if (!editMode) {
                openPostForm();
            }
        }, DOUBLE_CLICK_THRESHOLD);
    });

    // Cancel button closes form
    postCancelBtn.addEventListener('click', () => {
        closePostForm();
    });

    // Click overlay background to close
    postFormOverlay.addEventListener('click', (e) => {
        if (e.target === postFormOverlay) {
            closePostForm();
        }
    });

    // File input display name
    postFileInput.addEventListener('change', () => {
        if (postFileInput.files[0]) {
            postFileName.textContent = postFileInput.files[0].name;
        } else {
            postFileName.textContent = 'choose file';
        }
    });

    // Submit button
    postSubmitBtn.addEventListener('click', () => {
        handlePostSubmit();
    });

    // Category toggle
    addCategoryToggle.addEventListener('click', () => {
        if (postCategory.style.display !== 'none') {
            postCategory.style.display = 'none';
            postCategoryInput.style.display = 'block';
            postCategoryInput.value = '';
            postCategoryInput.focus();
            addCategoryToggle.textContent = '×';
        } else {
            postCategory.style.display = 'block';
            postCategoryInput.style.display = 'none';
            postCategoryInput.value = '';
            addCategoryToggle.textContent = '+';
        }
    });

    // Enter key in category input
    postCategoryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCategory();
        }
    });

    // Cover image prompt listeners
    coverImageInput.addEventListener('change', () => {
        if (coverImageInput.files[0]) {
            coverImageFileName.textContent = coverImageInput.files[0].name;
        } else {
            coverImageFileName.textContent = 'choose image';
        }
    });

    coverImageSubmitBtn.addEventListener('click', () => {
        handleCoverImageSubmit();
    });

    coverImageSkipBtn.addEventListener('click', () => {
        handleCoverImageSkip();
    });

        logoutBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert(`Logout failed: ${error.message}`);
            return;
        }
        window.location.href = './index.html';
    });
    
    // Escape key exits edit mode
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (editMode) {
                toggleEditMode();
            } else if (postFormOverlay.style.display === 'flex') {
                closePostForm();
            } else if (coverImageOverlay.style.display === 'flex') {
                closeCoverImagePrompt();
            }
        }
    });

    console.log('Post form initialized');
}

function openPostForm() {
    postFormOverlay.style.display = 'flex';
}

function closePostForm() {
    postFormOverlay.style.display = 'none';
    postTitle.value = '';
    postFileInput.value = '';
    postFileName.textContent = 'choose file';
    postText.value = '';
    postCategory.value = '';
    postCategory.style.display = 'block';
    postCategoryInput.style.display = 'none';
    postCategoryInput.value = '';
    addCategoryToggle.textContent = '+';
    editingPostId = null;
}

function closeCoverImagePrompt() {
    coverImageOverlay.style.display = 'none';
    coverImageInput.value = '';
    coverImageFileName.textContent = 'choose image';
    pendingPost = null;
}

// ============================================
// 4. EDIT MODE
// ============================================

function toggleEditMode() {
    editMode = !editMode;
    console.log('Edit mode:', editMode ? 'ON' : 'OFF');

    // Clear filters whenever we toggle edit mode (so nothing "sticks")
    activeUserFilter = null;
    activeCategoryFilter = null;

    if (editMode) {
        mainPageContainer.classList.add('edit-mode');
    } else {
        mainPageContainer.classList.remove('edit-mode');
    }

    loadPosts();
}

function openEditForm(post) {
    editingPostId = post.id;

    // Pre-fill the form
    postTitle.value = post.title || '';
    postText.value = post.body || '';
    postCategory.value = post.category || '';

    // Show existing file name if there was one
    if (post.file_name) {
        postFileName.textContent = post.file_name;
    } else {
        postFileName.textContent = 'choose file';
    }

    openPostForm();
}

async function handleDeletePost(postId) {
    try {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', currentUser.id); // Safety: only delete your own

        if (error) throw error;

        console.log('Post deleted:', postId);
        await loadPosts();

    } catch (error) {
        console.error('Delete failed:', error.message);
        alert(`Delete failed: ${error.message}`);
    }
}

// ============================================
// 5. CATEGORIES
// ============================================

async function loadCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('group_id', 'group1')
        .order('name', { ascending: true });

    if (error) {
        console.error('Failed to load categories:', error);
        return;
    }

    postCategory.innerHTML = '<option value="">none</option>';

    data.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        postCategory.appendChild(option);
    });

    console.log(`Loaded ${data.length} categories`);
}

async function handleAddCategory() {
    const name = postCategoryInput.value.trim();
    if (!name) return;

    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([{ name: name, group_id: 'group1' }])
            .select();

        if (error) throw error;

        console.log('Category added:', name);
        await loadCategories();
        postCategory.value = name;

        postCategory.style.display = 'block';
        postCategoryInput.style.display = 'none';
        postCategoryInput.value = '';
        addCategoryToggle.textContent = '+';

    } catch (error) {
        alert(`Failed to add category: ${error.message}`);
    }
}

// ============================================
// 6. POST SUBMISSION
// ============================================

async function handlePostSubmit() {
    const title = postTitle.value.trim();
    const body = postText.value.trim();
    const category = postCategory.value || null;
    const file = postFileInput.files[0] || null;

    if (!title && !file && !body) {
        alert('Add a title, text, or choose a file');
        return;
    }

    try {
        let fileURL = null;
        let fileName = null;
        let fileType = null;

        // Upload file if one was selected
        if (file) {
            fileName = file.name;
            fileType = getFileType(file);

            const filePath = `${currentUser.id}/${Date.now()}-${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('group1-posts')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('group1-posts')
                .getPublicUrl(filePath);

            fileURL = urlData.publicUrl;
            console.log('File uploaded:', fileURL);
        }

        // Build the post record (only include fields that changed)
        const postRecord = {
            title: title || null,
            body: body || null,
            category: category
        };

        // Only update file fields if a new file was uploaded
        if (file) {
            postRecord.file_url = fileURL;
            postRecord.file_name = fileName;
            postRecord.file_type = fileType;
        }

        // EDITING an existing post
        if (editingPostId) {
            // Non-visual file with new upload: show cover image prompt
            if (file && !isVisualFile(file)) {
                pendingPost = { ...postRecord, _isEdit: true, _editId: editingPostId };
                closePostForm();
                coverImageOverlay.style.display = 'flex';
                return;
            }

            await updatePost(editingPostId, postRecord);
            closePostForm();
            await loadPosts();
            return;
        }

        // CREATING a new post
        postRecord.user_id = currentUser.id;
        postRecord.group_id = 'group1';

        // If no new file was chosen, set file fields to null explicitly
        if (!file) {
            postRecord.file_url = null;
            postRecord.file_name = null;
            postRecord.file_type = null;
        }

        // Non-visual file: show cover image prompt
        if (file && !isVisualFile(file)) {
            pendingPost = postRecord;
            closePostForm();
            coverImageOverlay.style.display = 'flex';
            return;
        }

        await savePost(postRecord);
        closePostForm();
        await loadPosts();

    } catch (error) {
        console.error('Post submission failed:', error.message);
        alert(`Post failed: ${error.message}`);
    }
}

// ============================================
// 7. COVER IMAGE PROMPT
// ============================================

async function handleCoverImageSubmit() {
    if (!pendingPost) return;

    const coverFile = coverImageInput.files[0];
    if (!coverFile) {
        alert('Choose an image or click skip');
        return;
    }

    try {
        const filePath = `${currentUser.id}/covers/${Date.now()}-${coverFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('group1-posts')
            .upload(filePath, coverFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('group1-posts')
            .getPublicUrl(filePath);

        pendingPost.cover_image_url = urlData.publicUrl;
        console.log('Cover image uploaded:', pendingPost.cover_image_url);

        if (pendingPost._isEdit) {
            const editId = pendingPost._editId;
            delete pendingPost._isEdit;
            delete pendingPost._editId;
            await updatePost(editId, pendingPost);
        } else {
            await savePost(pendingPost);
        }

        closeCoverImagePrompt();
        await loadPosts();

    } catch (error) {
        console.error('Cover image upload failed:', error.message);
        alert(`Cover image failed: ${error.message}`);
    }
}

async function handleCoverImageSkip() {
    if (!pendingPost) return;

    try {
        if (pendingPost._isEdit) {
            const editId = pendingPost._editId;
            delete pendingPost._isEdit;
            delete pendingPost._editId;
            await updatePost(editId, pendingPost);
        } else {
            await savePost(pendingPost);
        }

        closeCoverImagePrompt();
        await loadPosts();

    } catch (error) {
        console.error('Post save failed:', error.message);
        alert(`Post failed: ${error.message}`);
    }
}

// ============================================
// 8. SAVE / UPDATE POST
// ============================================

async function savePost(postRecord) {
    const { data, error } = await supabase
        .from('posts')
        .insert([postRecord])
        .select();

    if (error) throw error;

    console.log('Post saved:', data[0].id);
    return data[0];
}

async function updatePost(postId, updates) {
    const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId)
        .eq('user_id', currentUser.id) // Safety: only edit your own
        .select();

    if (error) throw error;

    console.log('Post updated:', data[0].id);
    return data[0];
}

// ============================================
// 9. LOAD AND RENDER POSTS
// ============================================

async function loadPosts() {
    let query = supabase
        .from('posts')
        .select('*')
        .eq('group_id', 'group1')
        .order('created_at', { ascending: false });

    // In edit mode, only show current user's posts
        // In edit mode, always only show current user's posts (filters disabled)
    if (editMode) {
        query = query.eq('user_id', currentUser.id);
    } else {
        // Normal mode: apply optional filters
        if (activeUserFilter) {
            query = query.eq('user_id', activeUserFilter);
        }
        if (activeCategoryFilter) {
        if (activeCategoryFilter === NONE_CATEGORY_FILTER) {
            query = query.is('category', null);
        } else {
            query = query.eq('category', activeCategoryFilter);
        }
    }
    }

    const { data: posts, error } = await query;

    if (error) {
        console.error('Failed to load posts:', error);
        return;
    }

    const userIds = [...new Set(posts.map(p => p.user_id))];

    let users = [];
    if (userIds.length > 0) {
        const { data, error: usersError } = await supabase
            .from('users')
            .select('id, username, pfp, pfp_url')
            .in('id', userIds);

        if (usersError) {
            console.error('Failed to load users:', usersError);
            return;
        }
        users = data;
    }

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    postFeed.innerHTML = '';

    posts.forEach(post => {
        const user = userMap[post.user_id] || {};
        const card = buildPostCard(post, user);
        postFeed.appendChild(card);
    });

    console.log(`Loaded ${posts.length} posts`);
}

// ============================================
// 10. POST CARD BUILDER
// ============================================

function buildPostCard(post, user) {
    const card = document.createElement('div');
    card.className = 'post-card';

    const hasTitle = post.title && post.title.trim();
    const hasText = post.body && post.body.trim();

    const hasVisual = post.file_url && (
        post.file_type === 'image' ||
        post.file_type === 'video' ||
        post.cover_image_url
    );

    let visualSrc = null;
    if (post.file_type === 'image') {
        visualSrc = post.file_url;
    } else if (post.cover_image_url) {
        visualSrc = post.cover_image_url;
    }

    // Build content area
    const content = document.createElement('div');
    content.className = 'post-card-content';

    if (hasTitle && hasVisual && hasText) {
        content.classList.add('post-layout-title-visual-text');
        content.innerHTML = `
            <div class="post-title">${post.title}</div>
            <div class="post-visual-text-row">
                <img class="post-image" src="${visualSrc}" alt="">
                <div class="post-body">${post.body}</div>
            </div>
        `;
    }
    else if (hasTitle && hasVisual) {
        content.classList.add('post-layout-title-visual');
        content.innerHTML = `
            <div class="post-title">${post.title}</div>
            <img class="post-image" src="${visualSrc}" alt="">
        `;
    }
    else if (hasTitle && hasText) {
        content.classList.add('post-layout-title-text');
        content.innerHTML = `
            <div class="post-title">${post.title}</div>
            <div class="post-body">${post.body}</div>
        `;
    }
    else if (hasVisual) {
        content.classList.add('post-layout-visual');
        content.innerHTML = `
            <img class="post-image" src="${visualSrc}" alt="">
        `;
    }
    else if (hasTitle) {
        content.classList.add('post-layout-title');
        content.innerHTML = `
            <div class="post-title">${post.title}</div>
        `;
    }
    else if (hasText) {
        content.classList.add('post-layout-text');
        content.innerHTML = `
            <div class="post-body">${post.body}</div>
        `;
    }

    card.appendChild(content);

    // Build footer
    const footer = document.createElement('div');
    footer.className = 'post-footer';

    const pfpSrc = user.pfp_url || `./images/pfps/${user.pfp}`;

    if (editMode) {
    // Edit mode footer: pfp + edit/delete + (optional) filename + category
    footer.innerHTML = `
        <img class="post-footer-pfp" src="${pfpSrc}" alt="">
        <span class="post-footer-action post-footer-edit">edit</span>
        <span class="post-footer-action post-footer-delete">delete</span>
        ${post.file_name ? `<span class="post-footer-filename">${post.file_name}</span>` : ''}
        <span class="post-footer-category">${post.category || 'none'}</span>
    `;

    footer.querySelector('.post-footer-edit')?.addEventListener('click', () => {
        openEditForm(post);
    });

    footer.querySelector('.post-footer-delete')?.addEventListener('click', () => {
        handleDeletePost(post.id);
    });
} else {
    // Normal footer: pfp + clickable username/category filters
    footer.innerHTML = `
        <img class="post-footer-pfp" src="${pfpSrc}" alt="">
        <span class="post-footer-username post-footer-filter-btn">${user.username || 'unknown'}</span>
        ${post.file_name ? `<span class="post-footer-filename">${post.file_name}</span>` : ''}
        <span class="post-footer-category post-footer-filter-btn">${post.category || 'none'}</span>
    `;

    const usernameEl = footer.querySelector('.post-footer-username');
    if (usernameEl && user?.id) {
        usernameEl.addEventListener('click', () => {
            activeUserFilter = (activeUserFilter === user.id) ? null : user.id;
            loadPosts();
        });
    }

    const categoryEl = footer.querySelector('.post-footer-category');
    if (categoryEl) {
        categoryEl.addEventListener('click', () => {
            const isNone = post.category == null;

            const nextFilter = isNone ? NONE_CATEGORY_FILTER : post.category;

            activeCategoryFilter = (activeCategoryFilter === nextFilter) ? null : nextFilter;
            loadPosts();
        });
    }
}

    card.appendChild(footer);

    return card;
}

// ============================================
// 11. INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Main page loaded');

    const session = await checkAuth();
    if (!session) return;

    initializePostForm();
    await loadCategories();
    await loadPosts();

    console.log('Main page ready');
});