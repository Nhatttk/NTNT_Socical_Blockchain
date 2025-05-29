import { useState, useCallback } from 'react';

const GEMINI_API_KEY = 'AIzaSyALY27_i6A76VWgGf-fooesqFqMxSJ8qY4';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export const useGeminiSuggestion = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateSuggestions = useCallback(async (userText) => {
    if (!userText || userText.length < 5) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create optimized prompt for social media text suggestions
      const prompt = `You are a helpful AI assistant for a blockchain social media platform. A user is writing a post and has typed: "${userText}"

Please provide 5 creative and engaging text suggestions to complete or continue this post. The suggestions should be:
- Relevant to blockchain, crypto, web3, or general social media topics
- Engaging and likely to get community interaction
- Diverse in tone (some casual, some professional, some exciting)
- Each suggestion should be 10-50 words long
- Appropriate for a professional social media platform

Return ONLY a JSON array of strings, like this format:
["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]

Do not include any other text, explanations, or formatting. Just the pure JSON array.`;

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const generatedText = data.candidates[0].content.parts[0].text.trim();
        
        try {
          // Try to parse as JSON
          const parsedSuggestions = JSON.parse(generatedText);
          if (Array.isArray(parsedSuggestions)) {
            setSuggestions(parsedSuggestions.slice(0, 5)); // Limit to 5 suggestions
          } else {
            throw new Error('Response is not an array');
          }
        } catch (parseError) {
          // If JSON parsing fails, try to extract suggestions manually
          console.warn('Failed to parse JSON, trying manual extraction:', parseError);
          
          // Extract suggestions from text format
          const lines = generatedText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .filter(line => !line.startsWith('[') && !line.startsWith(']'))
            .map(line => line.replace(/^["\-\*\d\.\)\(]+\s*/, '').replace(/[",]+$/, ''))
            .filter(line => line.length > 5)
            .slice(0, 5);
          
          setSuggestions(lines);
        }
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError(err.message);
      
      // Fallback suggestions if API fails
      const fallbackSuggestions = getFallbackSuggestions(userText);
      setSuggestions(fallbackSuggestions);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFallbackSuggestions = (text) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('blockchain') || lowerText.includes('crypto')) {
      return [
        "This technology will revolutionize how we interact online! 🚀",
        "What are your thoughts on this development?",
        "The future is decentralized! 💫",
        "Let's discuss the implications of this innovation.",
        "Excited to see where this leads us! 🌟"
      ];
    }
    
    if (lowerText.includes('community') || lowerText.includes('together')) {
      return [
        "Together we build the future! 💪",
        "Our community is our strength! 🤝",
        "Love seeing everyone come together like this!",
        "This is what decentralization is all about! ✨",
        "Stronger together, always! 🌟"
      ];
    }
    
    if (lowerText.includes('excited') || lowerText.includes('happy')) {
      return [
        "Can't wait to share more updates with you all! 🎉",
        "This energy is contagious! Let's keep building! 🚀",
        "Feeling grateful for this amazing community! 🙏",
        "The best is yet to come! 💫",
        "Let's celebrate this milestone together! 🥳"
      ];
    }
    
    // Default fallback suggestions
    return [
      "What do you think about this? 💭",
      "Let me know your thoughts in the comments! 👇",
      "Excited to hear the community's perspective! 🌟",
      "This is just the beginning! 🚀",
      "Looking forward to the discussion! 💬"
    ];
  };

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  // Debounced version of generateSuggestions
  const debouncedGenerateSuggestions = useCallback(
    debounce(generateSuggestions, 1000),
    [generateSuggestions]
  );

  return {
    suggestions,
    isLoading,
    error,
    getSuggestions: debouncedGenerateSuggestions,
    clearSuggestions,
  };
};

// Debounce utility function
function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
} 