import React, { useState, useEffect } from 'react';
import { Search, BookOpen, FileText, Plus, X, Book, Save } from 'lucide-react'; 
import Banner from '../components/Banner/banner.jsx';

//Mock translation data with pinyin
const mockTranslations = {
    '高运': { pinyin: 'gāo yùn', translation: 'Gao Yun' },
    '请客': { pinyin: 'qǐng kè', translation: 'treat guests' },
    '从': { pinyin: 'cóng', translation: 'from' },
    '家': { pinyin: 'jiā', translation: 'home' },
    '回来': { pinyin: 'huí lái', translation: 'come back' },
    '很': { pinyin: 'hěn', translation: 'very' },
    '晚': { pinyin: 'wǎn', translation: 'late' },
    '了': { pinyin: 'le', translation: 'particle' },
    '曹操': { pinyin: 'cáo cāo', translation: 'Cao Cao' },
    '还': { pinyin: 'hái', translation: 'still' },
    '没有': { pinyin: 'méi yǒu', translation: 'do not have' },
    '睡': { pinyin: 'shuì', translation: 'sleep' },
    '他': { pinyin: 'tā', translation: 'he' },
    '手里': { pinyin: 'shǒu lǐ', translation: 'in hand' },
    '拿着': { pinyin: 'ná zhe', translation: 'holding' },
    '刀': { pinyin: 'dāo', translation: 'knife' },
    '好像': { pinyin: 'hǎo xiàng', translation: 'seems like' },
    '听到': { pinyin: 'tīng dào', translation: 'hear' },
    '一个': { pinyin: 'yí gè', translation: 'one' },
    '声音': { pinyin: 'shēng yīn', translation: 'voice' },
    '在': { pinyin: 'zài', translation: 'at' },
    '说': { pinyin: 'shuō', translation: 'say' },
    '请您': { pinyin: 'qǐng nín', translation: 'please you' },
    '一定': { pinyin: 'yí dìng', translation: 'definitely' },
    '要': { pinyin: 'yào', translation: 'must' },
    '杀了': { pinyin: 'shā le', translation: 'kill' },
    '看看': { pinyin: 'kàn kàn', translation: 'look at' },
    '想到': { pinyin: 'xiǎng dào', translation: 'think of' },
    '今天': { pinyin: 'jīn tiān', translation: 'today' },
    '大家': { pinyin: 'dà jiā', translation: 'everyone' },
    '对': { pinyin: 'duì', translation: 'to' },
    '说的': { pinyin: 'shuō de', translation: 'said' },
    '话': { pinyin: 'huà', translation: 'words' },
    '突然': { pinyin: 'tū rán', translation: 'suddenly' },
    '觉得': { pinyin: 'jué de', translation: 'feel' },
    '手上': { pinyin: 'shǒu shàng', translation: 'in hand' },
    '的': { pinyin: 'de', translation: 'particle' },
    '变得': { pinyin: 'biàn de', translation: 'become' },
    '重': { pinyin: 'zhòng', translation: 'heavy' }
}

const ChineseReaderApp = () => {
    const [stories, setStories] = useState([]);
    const [currentStory, setCurrentStory] = useState(null);
    const [showImport, setShowImport] = useState(false);
    const [selectedWord, setSelectedWord] = useState(null);
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
    const [bannerContent, setBannerContent] = useState(null);
    const [importText, setImportText] = useState('');
    const [storyTitle, setStoryTitle] = useState('');

    //sample story
    useEffect(() => {
        if (stories.length === 0) {
            const sampleStory = {
                id: 1,
                title: "Gao Yun Entertains Guests",
                sentences: [
                    {
                       chinese: "从高运家回来，很晚了，曹操还没有睡。",
                        translation: "Coming back from Gao Yun's house, it was very late, and Cao Cao still hadn't slept.",
                        words: ["从", "高运", "家", "回来", "，", "很", "晚", "了", "，", "曹操", "还", "没有", "睡", "。"]
                    },
                    {
                        chinese: "他手里拿着刀，好像听到一个声音在说：请您一定要杀了他！",
                        translation: "He held a knife in his hand, as if he heard a voice saying: Please, you must kill him!",
                        words: ["他", "手里", "拿着", "刀", "，", "好像", "听到", "一个", "声音", "在", "说", "：", "请您", "一定", "要", "杀了", "他", "！"]
                    },
                    {
                        chinese: "他看看刀，想到今天在高运家，大家对他说的话，突然觉得手上的刀变得很重很重。",
                        translation: "He looked at the knife, thinking about what everyone said to him today at Gao Yun's house, and suddenly felt the knife in his hand become very, very heavy.",
                        words: ["他", "看看", "刀", "，", "想到", "今天", "在", "高运", "家", "，", "大家", "对", "他", "说的", "话", "，", "突然", "觉得", "手上", "的", "刀", "变得", "很", "重", "很", "重", "。"]
                    }
                ],
                createdAt: new Date().toISOString()
            };
            setStories([sampleStory]);
        }
    }, [stories]);

    //Set initial banner content when story loads
    useEffect(() => {
        if (currentStory && currentStory.sentences.length > 0) {
            setBannerContent({
                type: 'sentence',
                content: currentStory.sentences[0].translation
            });
            setCurrentSentenceIndex(0);
        }
    }, [currentStory]);

    const parseStoryText = (text) => {
        const lines = text.trim().split('\n').filter(line => line.trim());
        const sentences = [];

        for (let i = 0; i < lines.length; i+=2) {
            const chinese = lines[i]?.trim();
            const translation = lines[i + 1]?.trim();

            if (chinese && translation) {
                sentences.push({
                    chinese,
                    translation,
                    words: segmentChinese(chinese)
                });
            }
        }

        return sentences;
    };

    const segmentChinese = (text) => {
        const words = [];
        let currentWord = '';

        for (let char of text) {
            if (/[\u4e00-\u9fff]/.test(char)) {
                currentWord += char;

                if (mockTranslations[currentWord]) {
                    words.push(currentWord);
                    currentWord = '';
                } else if (currentWord.length >= 2) {
                    words.push(currentWord.slice(0, -1));
                    currentWord = currentWord.slice(-1);
                }
            } else {
                if (currentWord) {
                    words.push(currentWord);
                    currentWord = '';
                }
                if (char.trim()) {
                    words.push(char);
                }
            }
        }

        if (currentWord) {
            words.push(currentWord);
        }

        return words;
    };
    
    const findSentenceIndexForWord = (wordIndex) => {
        let totalWords = 0;
        for (let i = 0; i < currentStory.sentences.length; i++) {
            totalWords += currentStory.sentences[i].words.length;
            if (wordIndex < totalWords) {
                return i;
            }
        }
        return 0;
    };

    const handleLineInteraction = (sentenceIndex, action) => {
        if (action === 'enter') {
            setBannerContent({
                type: 'sentence',
                content: currentStory.sentences[sentenceIndex].translation
            });
            setCurrentSentenceIndex(sentenceIndex);
        }
    };

    const handleWordInteraction = (word, sentenceIndex, action) => {
        if (action === 'enter' || action === 'down') {
            const wordData = mockTranslations[word];
            if (wordData) {
                setSelectedWord(word);
                setBannerContent({
                    type: 'word',
                    word: word,
                    pinyin: wordData.pinyin,
                    translation: wordData.translation
                });
            }
        } else if (action === 'leave' || action === 'up') {
            setSelectedWord(null);
            setBannerContent({
                type: 'sentence',
                content: currentStory.sentences[sentenceIndex].translation
            });
            setCurrentSentenceIndex(sentenceIndex);
        }
    };

    const handleImportStory = () => {
        if (!storyTitle.trim() || !importText.trim()) return;

        const sentences = parseStoryText(importText);
        const newStory = {
            id: Date.now(),
            title: storyTitle.trim(),
            sentences,
            createdAt: new Date().toISOString()
        };
        setStories(prev => [...prev, newStory]);
        setStoryTitle('');
        setImportText('');
        setShowImport(false);
    };

    return (
        <div className="reading-app">
            <Banner />
            <header className="reading-header">
                <div className="reading-header__content">
                    <h1 className="reading-header__title">Chinese Reading App</h1>
                    <div className="reading-header__actions">
                        <Search className="w-5 h-5" />
                        <button
                            onClick={() => setShowImport(true)}
                            className="w-5 h-5"
                        >
                            <Plus />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <div className="reading-header__tabs">
                    <button
                        onClick={() => setCurrentStory(null)}
                        className={`reading-tab ${!currentStory ? 'reading-tab--active' : ''}`}
                    >
                        <BookOpen className="w-5 h-5" />
                        <span className="text-sm">Home</span>
                    </button>
                    <button className="reading-tab">
                        <Book className="w-5 h-5" />
                        <span className="text-sm">Discover</span>
                    </button>
                    <button className="reading-tab">
                        <FileText className="w-5 h-5" />
                        <span className="text-sm">Flashcards</span>
                    </button>
                </div>
            </header>

            {/* Translation Banner - Shown only when reading */}
            {currentStory && bannerContent && (
                <div className="translation-banner">
                    {bannerContent.type === 'word' ? (
                        <div className="text-center w-full">
                            <div className="translation-word">
                                {bannerContent.word}
                            </div>
                            <div className="translation-pinyin">
                                {bannerContent.pinyin}
                            </div>
                            <div className="translation-text">
                                {bannerContent.translation}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center w-full">
                            <div className="translation-text">
                                {bannerContent.content}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Main Content */}
            <main className="reading-content">
                {currentStory ? (
                    /* Story Reader */
                    <div>
                        <button
                            onClick={() => setCurrentStory(null)}
                            className="text-blue-400 mb-4 flex items-center gap-2"
                            style={{ color: '#60a5fa', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            ← Back to Stories
                        </button>
                        
                        <h2 className="text-xl font-semibold mb-6" style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                            {currentStory.title}
                        </h2>

                        <div className="story-text">
                            {currentStory.sentences.map((sentence, sentenceIndex) => (
                                <div key={sentenceIndex} className="relative inline">
                                    {/* Invisible line hover area */}
                                    <div
                                        className="absolute inset-0 pointer-events-auto"
                                        style={{
                                            top: '-4px',
                                            left: '0',
                                            right: '0',
                                            bottom: '-6px'
                                        }}
                                        onMouseEnter={() => handleLineInteraction(sentenceIndex, 'enter')}
                                    />

                                    {sentence.words.map((word, wordIndex) => (
                                        <span
                                            key={`${sentenceIndex}-${wordIndex}`}
                                            className={`word-highlight ${selectedWord === word ? 'word-highlight--selected' : ''}`}
                                            style={{
                                                padding: '2px 0',
                                                margin: '0',
                                                position: 'relative',
                                                zIndex: 10
                                            }}
                                            onMouseEnter={(e) => {
                                                e.stopPropagation(); 
                                                handleWordInteraction(word, sentenceIndex, 'enter');
                                            }}
                                            onMouseLeave={(e) => {
                                                e.stopPropagation(); 
                                                handleWordInteraction(word, sentenceIndex, 'leave');
                                            }}
                                            onMouseDown={() => handleWordInteraction(word, sentenceIndex, 'down')}
                                            onMouseUp={() => handleWordInteraction(word, sentenceIndex, 'up')}
                                            onTouchStart={() => handleWordInteraction(word, sentenceIndex, 'down')}
                                            onTouchEnd={() => handleWordInteraction(word, sentenceIndex, 'up')} 
                                        >
                                            {word}
                                        </span>
                                    ))} 

                                    {/* Small border between lines */}
                                    {sentenceIndex < currentStory.sentences.length - 1 && (
                                        <div className="inline-block w-0 h-1 pointer-events-none" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Story List */
                    <div>
                        <div className="flex justify-between items-center mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>My Stories</h2>
                            <button 
                                onClick={() => setShowImport(true)}
                                className="reading-btn reading-btn--primary"
                                style={{ marginBottom: 0 }}
                            >
                                <Plus className="w-4 h-4" />
                                Add Story
                            </button>
                        </div>

                        {stories.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af' }}>
                                <FileText className="w-16 h-16 mx-auto mb-4" style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem auto', color: '#4b5563' }} />
                                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No stories found.</p>
                                <p>Import your first Chinese story to get started</p>
                            </div>
                        ) : (
                            <div className="story-list">
                                {stories.map((story) => (
                                    <div
                                        key={story.id}
                                        onClick={() => setCurrentStory(story)}
                                        className="story-card"
                                    >
                                        <h3 className="story-card__title">{story.title}</h3>
                                        <p className="story-card__meta">
                                            {story.sentences.length} sentences
                                        </p>
                                        <p className="story-card__meta" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                            Added {new Date(story.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Import Modal */}
            {showImport && (
                <div className="reading-modal-overlay">
                    <div className="reading-modal">
                        <div className="reading-modal__header">
                            <h3 className="reading-modal__title">Import Story</h3>
                            <button 
                                onClick={() => setShowImport(false)}
                                className="reading-modal__close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="reading-form-group">
                                <label className="reading-form-label">Story Title</label>
                                <input
                                    type="text"
                                    value={storyTitle}
                                    onChange={(e) => setStoryTitle(e.target.value)}
                                    placeholder="Enter story title..."
                                    className="reading-form-input"
                                />
                            </div>

                            <div className="reading-form-group">
                                <label className="reading-form-label">
                                    Story Content
                                    <span className="reading-form-hint" style={{ display: 'block' }}>
                                        Format: Chinese sentence, then English translation on next line, repeat.
                                    </span>
                                </label>
                                <textarea
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                    placeholder="从高运家回来，很晚了，曹操还没有睡。&#10;Coming back from Gao Yun's house, it was very late, and Cao Cao still hadn't slept.&#10;&#10;他手里拿着刀，好像听到一个声音在说...&#10;He held a knife in his hand, as if he heard a voice saying..."
                                    rows={10}
                                    className="reading-form-textarea"
                                />
                            </div>
                        </div>
                        
                        <div className="reading-button-group">
                            <button 
                                onClick={() => setShowImport(false)}
                                className="reading-btn reading-btn--secondary"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleImportStory}
                                disabled={!storyTitle.trim() || !importText.trim()}
                                className="reading-btn reading-btn--primary"
                            >
                                <Save className="w-4 h-4" />
                                Import Story
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChineseReaderApp;