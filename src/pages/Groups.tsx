import { useParams } from 'react-router-dom';
import { useState } from 'react';

export default function GroupPage() {
  const { groupId } = useParams();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);

  const handlePost = () => {
    if (content.trim() || media) {
      const newPost = {
        id: Date.now(),
        content,
        media: media ? URL.createObjectURL(media) : null,
        mediaType: media?.type.startsWith('video') ? 'video' : 'image',
      };
      setPosts([newPost, ...posts]);
      setContent('');
      setMedia(null);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Група #{groupId}</h2>

      {/* Форма для поста */}
      <div className="mb-4">
        <textarea
          className="w-full p-2 border rounded"
          placeholder="Напишіть щось..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setMedia(e.target.files[0])}
          className="my-2"
        />
        <button
          onClick={handlePost}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Опублікувати
        </button>
      </div>

      {/* Список постів */}
      {posts.map((post) => (
        <div key={post.id} className="border rounded p-4 mb-2">
          <p>{post.content}</p>
          {post.media && post.mediaType === 'image' && (
            <img src={post.media} alt="Фото" className="mt-2 max-h-64 object-contain" />
          )}
          {post.media && post.mediaType === 'video' && (
            <video controls className="mt-2 max-h-64 object-contain">
              <source src={post.media} />
            </video>
          )}
        </div>
      ))}
    </div>
  );
}
