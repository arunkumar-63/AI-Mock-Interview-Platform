const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-pro as it's the stable model
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Get detailed subject-specific guidance for question generation
   */
  getSubjectSpecificGuidance(subject, difficulty) {
    const guidance = {
      'java': `
   JAVA-SPECIFIC REQUIREMENTS:
   - Core Java concepts: OOP, inheritance, polymorphism, encapsulation, abstraction
   - Collections Framework: ArrayList, HashMap, LinkedList, HashSet, TreeSet, etc.
   - Multithreading and Concurrency: Thread, Runnable, ExecutorService, synchronized, volatile
   - Exception Handling: try-catch, checked vs unchecked exceptions, custom exceptions
   - Java 8+ Features: Lambda expressions, Stream API, Optional, functional interfaces
   - JVM Internals: Memory management, garbage collection, class loading
   - JDBC and Database Connectivity
   - Spring Framework (if applicable to experience level)
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Basic syntax, data types, control structures\n   - Simple OOP concepts\n   - Basic collections usage' : ''}
   ${difficulty === 'intermediate' ? '- Advanced OOP, design patterns\n   - Collections framework deep dive\n   - Multithreading basics\n   - Exception handling best practices' : ''}
   ${difficulty === 'advanced' ? '- JVM internals and performance tuning\n   - Advanced concurrency patterns\n   - Design patterns and architecture\n   - Framework internals (Spring, Hibernate)' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "Explain the difference between [Java Concept A] and [Java Concept B]"
   - "How would you implement [Data Structure/Pattern] in Java?"
   - "What happens internally when you [perform Java operation]?"
   - "Write a Java program to [solve specific problem]"`,
      
      'python': `
   PYTHON-SPECIFIC REQUIREMENTS:
   - Core Python: Data types, control flow, functions, modules, packages
   - Data Structures: Lists, tuples, sets, dictionaries, comprehensions
   - OOP in Python: Classes, inheritance, magic methods, decorators
   - Python-specific features: Generators, iterators, context managers
   - Standard Library: collections, itertools, functools, os, sys
   - Exception Handling: try-except-else-finally, custom exceptions
   - File I/O and data processing
   - Python GIL and threading/multiprocessing
   - Popular frameworks: Django, Flask, FastAPI (if applicable)
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Basic syntax and data types\n   - Simple functions and loops\n   - Basic data structures usage' : ''}
   ${difficulty === 'intermediate' ? '- Decorators and generators\n   - OOP concepts\n   - File handling and modules\n   - Common libraries (requests, pandas)' : ''}
   ${difficulty === 'advanced' ? '- Metaclasses and descriptors\n   - Async/await and concurrency\n   - Performance optimization\n   - Framework internals' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "How does [Python feature] work internally?"
   - "Implement [algorithm/pattern] using Python"
   - "What's the difference between [Python Concept A] and [Python Concept B]?"
   - "Explain the use of [Python built-in/library]"`,
      
      'javascript': `
   JAVASCRIPT-SPECIFIC REQUIREMENTS:
   - Core JavaScript: Variables (let/const/var), data types, functions, scope
   - ES6+ Features: Arrow functions, destructuring, spread/rest, template literals
   - Asynchronous Programming: Promises, async/await, callbacks, event loop
   - DOM Manipulation and Browser APIs
   - Objects and Prototypes: Prototypal inheritance, this keyword, bind/call/apply
   - Closures and Higher-Order Functions
   - Array methods: map, filter, reduce, forEach, etc.
   - Error Handling: try-catch, Promise error handling
   - Modern JavaScript: Modules (import/export), classes
   - Frontend Frameworks: React, Vue, Angular (if applicable)
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Basic syntax and data types\n   - Simple functions and loops\n   - Basic DOM manipulation\n   - Simple async operations' : ''}
   ${difficulty === 'intermediate' ? '- Closures and scope\n   - Promises and async/await\n   - ES6+ features\n   - Array methods and functional programming' : ''}
   ${difficulty === 'advanced' ? '- Event loop and microtasks\n   - Advanced patterns and architectures\n   - Performance optimization\n   - Framework internals' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "Explain how [JS concept] works in JavaScript"
   - "What's the difference between [JS Feature A] and [JS Feature B]?"
   - "Implement [function/pattern] using JavaScript"
   - "How does the JavaScript engine handle [specific scenario]?"`,
      
      'dsa': `
   DATA STRUCTURES & ALGORITHMS REQUIREMENTS:
   - Data Structures: Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Hash Tables, Heaps
   - Algorithms: Sorting, Searching, Recursion, Dynamic Programming, Greedy, Backtracking
   - Complexity Analysis: Big O notation, time/space complexity
   - Problem-Solving Patterns: Two pointers, sliding window, BFS/DFS, divide and conquer
   - Tree Algorithms: Traversals, BST operations, balanced trees
   - Graph Algorithms: Shortest path, MST, topological sort, cycle detection
   - String Algorithms: Pattern matching, substring problems
   - Array Algorithms: Subarray problems, matrix operations
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Basic arrays and strings\n   - Simple sorting algorithms\n   - Stack and queue basics\n   - Linear search, binary search' : ''}
   ${difficulty === 'intermediate' ? '- Linked list operations\n   - Tree traversals and BST\n   - Hash table problems\n   - Medium complexity DP problems' : ''}
   ${difficulty === 'advanced' ? '- Advanced graph algorithms\n   - Complex DP problems\n   - Optimization techniques\n   - Hard LeetCode-style problems' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "Implement a [data structure] with [specific operations]"
   - "Find the [optimal solution] for [algorithmic problem]"
   - "What is the time/space complexity of [algorithm]?"
   - "Solve: [LeetCode-style problem description]"`,
      
      'system-design': `
   SYSTEM DESIGN REQUIREMENTS:
   - Scalability: Horizontal/vertical scaling, load balancing, caching
   - Database Design: SQL vs NoSQL, sharding, replication, indexing
   - API Design: REST, GraphQL, gRPC, API versioning
   - Distributed Systems: CAP theorem, consistency models, distributed transactions
   - Architecture Patterns: Microservices, monolithic, serverless, event-driven
   - Infrastructure: CDN, cloud services, containerization
   - Performance: Caching strategies, optimization techniques
   - Reliability: Fault tolerance, disaster recovery, monitoring
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Basic client-server architecture\n   - Simple database design\n   - Basic API design\n   - Caching concepts' : ''}
   ${difficulty === 'intermediate' ? '- Microservices architecture\n   - Load balancing and scaling\n   - Database sharding\n   - Message queues' : ''}
   ${difficulty === 'advanced' ? '- Large-scale distributed systems\n   - Consensus algorithms\n   - Global distribution\n   - Real-world company systems (Twitter, Netflix, etc.)' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "Design a [large-scale system like Twitter/Uber/etc.]"
   - "How would you scale [specific component]?"
   - "Design a [specific feature] for [millions/billions] of users"
   - "What trade-offs would you make when designing [system]?"`,
      
      'database': `
   DATABASE REQUIREMENTS:
   - SQL Fundamentals: SELECT, JOIN, GROUP BY, subqueries, indexes
   - Database Design: Normalization, ER diagrams, relationships
   - NoSQL: MongoDB, Redis, Cassandra, document vs key-value vs column-family
   - Query Optimization: Indexes, explain plans, query performance
   - Transactions: ACID properties, isolation levels, deadlocks
   - Database Administration: Backup, recovery, monitoring
   - Scaling: Replication, sharding, partitioning
   - Advanced: Stored procedures, triggers, views
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Basic SQL queries\n   - Simple joins\n   - Database normalization\n   - Basic CRUD operations' : ''}
   ${difficulty === 'intermediate' ? '- Complex joins and subqueries\n   - Indexing strategies\n   - Transaction management\n   - NoSQL basics' : ''}
   ${difficulty === 'advanced' ? '- Query optimization\n   - Database sharding\n   - Distributed databases\n   - Performance tuning' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "Write a SQL query to [solve specific problem]"
   - "How would you optimize [specific query]?"
   - "Explain the difference between [DB Concept A] and [DB Concept B]"
   - "Design a database schema for [specific use case]"`,
      
      'react': `
   REACT-SPECIFIC REQUIREMENTS:
   - Core Concepts: Components, JSX, props, state, lifecycle
   - Hooks: useState, useEffect, useContext, useReducer, custom hooks
   - Component Patterns: HOC, render props, compound components
   - State Management: Context API, Redux, MobX, Zustand
   - Performance: useMemo, useCallback, React.memo, lazy loading
   - Routing: React Router, navigation, protected routes
   - Forms: Controlled vs uncontrolled, validation
   - API Integration: Fetch, axios, data fetching patterns
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Basic components and JSX\n   - Props and state\n   - Simple event handling\n   - Basic hooks (useState, useEffect)' : ''}
   ${difficulty === 'intermediate' ? '- Advanced hooks\n   - Context API\n   - Performance optimization\n   - Forms and validation' : ''}
   ${difficulty === 'advanced' ? '- Custom hooks\n   - Advanced patterns\n   - State management libraries\n   - Server-side rendering' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "How would you implement [React feature]?"
   - "Explain the difference between [React Concept A] and [React Concept B]"
   - "Optimize this React component for [specific scenario]"
   - "Build a [component] using React hooks"`,

      'node': `
   NODE.JS-SPECIFIC REQUIREMENTS:
   - Core Modules: fs, http, path, os, events, stream
   - Asynchronous Programming: Callbacks, Promises, async/await, event loop
   - Express.js: Routing, middleware, error handling, RESTful APIs
   - Database Integration: MongoDB, MySQL, PostgreSQL
   - Authentication: JWT, sessions, OAuth, Passport.js
   - Security: Input validation, sanitization, HTTPS, CORS
   - File Handling: Uploads, streams, buffers
   - Testing: Jest, Mocha, Chai, Supertest
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Basic HTTP server\n   - Simple Express routes\n   - File system operations\n   - NPM basics' : ''}
   ${difficulty === 'intermediate' ? '- Middleware patterns\n   - Database integration\n   - Authentication\n   - Error handling' : ''}
   ${difficulty === 'advanced' ? '- Microservices\n   - Performance optimization\n   - Clustering and scaling\n   - Real-time applications (WebSockets)' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "Build a [REST API endpoint] in Node.js"
   - "How does [Node.js concept] work?"
   - "Implement [authentication/authorization] in Express"
   - "Optimize a Node.js application for [specific scenario]"`,

      'general': `
   GENERAL/MIXED REQUIREMENTS:
   - Mix of technical and non-technical questions
   - Career-focused questions appropriate to experience level
   - Problem-solving and analytical thinking
   - Communication and soft skills
   - Project and team collaboration experiences`,

      'ml': `
   MACHINE LEARNING REQUIREMENTS:
   - ML Fundamentals: Supervised/unsupervised learning, regression, classification
   - Algorithms: Linear regression, logistic regression, decision trees, random forests, SVM, k-means
   - Deep Learning: Neural networks, CNN, RNN, LSTM, transformers
   - Model Evaluation: Accuracy, precision, recall, F1-score, confusion matrix, ROC-AUC
   - Feature Engineering: Normalization, scaling, encoding, feature selection
   - Libraries: scikit-learn, TensorFlow, PyTorch, Keras, pandas, numpy
   - Optimization: Gradient descent, backpropagation, hyperparameter tuning
   - Real-world: Overfitting, underfitting, bias-variance tradeoff, cross-validation
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Basic ML concepts and terminology\n   - Simple algorithms (linear regression, k-means)\n   - Data preprocessing basics\n   - scikit-learn basics' : ''}
   ${difficulty === 'intermediate' ? '- Advanced algorithms (SVM, ensemble methods)\n   - Neural network basics\n   - Feature engineering\n   - Model evaluation metrics' : ''}
   ${difficulty === 'advanced' ? '- Deep learning architectures\n   - Advanced optimization techniques\n   - Production ML systems\n   - Research-level topics' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "Explain the difference between [ML Algorithm A] and [ML Algorithm B]"
   - "How would you handle [ML problem like overfitting/imbalanced data]?"
   - "Implement [ML algorithm] from scratch"
   - "Design an ML system for [specific use case]"`,

      'ai': `
   ARTIFICIAL INTELLIGENCE REQUIREMENTS:
   - AI Fundamentals: Search algorithms, knowledge representation, reasoning
   - Search: BFS, DFS, A*, heuristic search, adversarial search
   - Knowledge Representation: Logic, semantic networks, ontologies
   - NLP: Tokenization, word embeddings, transformers, BERT, GPT
   - Computer Vision: Image processing, object detection, CNNs, YOLO, ResNet
   - Reinforcement Learning: Q-learning, policy gradients, deep RL
   - AI Ethics: Bias, fairness, transparency, responsible AI
   - Applications: Chatbots, recommendation systems, autonomous systems
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Basic AI concepts and history\n   - Simple search algorithms\n   - Rule-based systems\n   - Introduction to NLP' : ''}
   ${difficulty === 'intermediate' ? '- Advanced search techniques\n   - Machine learning for AI\n   - NLP techniques\n   - Computer vision basics' : ''}
   ${difficulty === 'advanced' ? '- Reinforcement learning\n   - Advanced NLP (transformers)\n   - Multi-agent systems\n   - AI research topics' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "How does [AI technique] work?"
   - "Implement [AI algorithm] for [specific problem]"
   - "Compare [AI Approach A] vs [AI Approach B]"
   - "Design an AI system for [real-world application]"`,

      'data-science': `
   DATA SCIENCE REQUIREMENTS:
   - Statistics: Probability, distributions, hypothesis testing, correlation, regression
   - Data Analysis: Exploratory data analysis, data cleaning, feature engineering
   - Visualization: Matplotlib, Seaborn, Plotly, Tableau, data storytelling
   - Tools: Python (pandas, numpy), R, SQL, Jupyter notebooks
   - Big Data: Spark, Hadoop, distributed computing
   - Business Analytics: KPIs, A/B testing, experimental design
   - Model Building: ML algorithms, model selection, deployment
   - Domain Knowledge: Understanding business problems and metrics
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Basic statistics and probability\n   - Data manipulation with pandas\n   - Simple visualizations\n   - SQL basics' : ''}
   ${difficulty === 'intermediate' ? '- Statistical testing\n   - Advanced pandas operations\n   - Feature engineering\n   - ML model building' : ''}
   ${difficulty === 'advanced' ? '- Advanced statistics\n   - Big data processing\n   - Production data pipelines\n   - Business strategy and analytics' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "How would you analyze [business problem]?"
   - "Explain [statistical concept] and when to use it"
   - "Clean and prepare [type of dataset]"
   - "Design an A/B test for [scenario]"`,

      'devops': `
   DEVOPS REQUIREMENTS:
   - CI/CD: Jenkins, GitLab CI, GitHub Actions, CircleCI
   - Containerization: Docker, container orchestration, Docker Compose
   - Orchestration: Kubernetes, pod management, services, deployments
   - Cloud Platforms: AWS, Azure, GCP, cloud services
   - Infrastructure as Code: Terraform, Ansible, CloudFormation
   - Monitoring: Prometheus, Grafana, ELK stack, logging
   - Version Control: Git, branching strategies, code review
   - Automation: Shell scripting, Python automation, build automation
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Git basics\n   - Basic Docker concepts\n   - Simple CI/CD pipelines\n   - Linux command line' : ''}
   ${difficulty === 'intermediate' ? '- Kubernetes fundamentals\n   - Advanced Docker\n   - Infrastructure as Code\n   - Monitoring and logging' : ''}
   ${difficulty === 'advanced' ? '- Complex K8s architectures\n   - Multi-cloud strategies\n   - Advanced automation\n   - Security and compliance' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "How would you set up [DevOps tool/pipeline]?"
   - "Explain the difference between [DevOps Concept A] and [DevOps Concept B]"
   - "Debug and fix [infrastructure problem]"
   - "Design a CI/CD pipeline for [application type]"`,

      'cloud': `
   CLOUD COMPUTING REQUIREMENTS:
   - Cloud Providers: AWS, Azure, GCP, cloud service models
   - Compute: EC2, Lambda, Cloud Functions, serverless
   - Storage: S3, EBS, Cloud Storage, object storage
   - Networking: VPC, subnets, load balancers, CDN
   - Databases: RDS, DynamoDB, Cloud SQL, managed databases
   - Security: IAM, security groups, encryption, compliance
   - Cost Optimization: Reserved instances, autoscaling, cost analysis
   - Architecture: Multi-region, high availability, disaster recovery
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Basic cloud concepts\n   - Core services (compute, storage)\n   - Simple deployments\n   - Basic security' : ''}
   ${difficulty === 'intermediate' ? '- Advanced services\n   - Networking and VPC\n   - Database management\n   - Cost optimization' : ''}
   ${difficulty === 'advanced' ? '- Multi-cloud architectures\n   - Advanced security\n   - Large-scale migrations\n   - Cloud-native design patterns' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "How would you architect [application] on [cloud provider]?"
   - "Compare [Cloud Service A] vs [Cloud Service B]"
   - "Optimize costs for [scenario]"
   - "Design a disaster recovery plan for [system]"`,

      'cybersecurity': `
   CYBERSECURITY REQUIREMENTS:
   - Security Fundamentals: CIA triad, threat modeling, risk assessment
   - Network Security: Firewalls, IDS/IPS, VPN, network protocols
   - Application Security: OWASP Top 10, XSS, SQL injection, CSRF
   - Cryptography: Encryption, hashing, digital signatures, PKI
   - Identity & Access: Authentication, authorization, OAuth, SAML
   - Incident Response: Detection, analysis, containment, recovery
   - Compliance: GDPR, HIPAA, PCI-DSS, security frameworks
   - Tools: Wireshark, Metasploit, Burp Suite, Nmap
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Basic security concepts\n   - Common vulnerabilities\n   - Password security\n   - Basic cryptography' : ''}
   ${difficulty === 'intermediate' ? '- Web application security\n   - Network security\n   - Secure coding practices\n   - Security testing' : ''}
   ${difficulty === 'advanced' ? '- Advanced threats (APTs)\n   - Security architecture\n   - Penetration testing\n   - Incident response' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "How would you secure [application/system]?"
   - "Explain [security vulnerability] and how to prevent it"
   - "Respond to [security incident scenario]"
   - "Implement [security control/feature]"`,

      'mobile': `
   MOBILE DEVELOPMENT REQUIREMENTS:
   - Android: Java/Kotlin, Android SDK, Activities, Fragments, Services
   - iOS: Swift, UIKit, SwiftUI, iOS SDK, view controllers
   - Cross-platform: React Native, Flutter, Xamarin
   - UI/UX: Material Design, Human Interface Guidelines, responsive design
   - Data: SQLite, Room, Core Data, API integration
   - Performance: Memory management, battery optimization, offline support
   - Testing: Unit testing, UI testing, debugging
   - Deployment: App Store, Google Play, app signing
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Basic app structure\n   - Simple UI components\n   - Basic navigation\n   - Local storage' : ''}
   ${difficulty === 'intermediate' ? '- Advanced UI patterns\n   - Networking and APIs\n   - State management\n   - Background tasks' : ''}
   ${difficulty === 'advanced' ? '- Performance optimization\n   - Advanced architecture (MVVM, Clean)\n   - Complex animations\n   - Platform-specific features' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "How would you implement [mobile feature]?"
   - "Compare [Mobile Framework A] vs [Mobile Framework B]"
   - "Optimize [performance issue] in mobile app"
   - "Design [mobile app] for [specific use case]"`,

      'blockchain': `
   BLOCKCHAIN REQUIREMENTS:
   - Fundamentals: Distributed ledger, consensus, mining, nodes
   - Cryptography: Hashing, public-key cryptography, digital signatures
   - Smart Contracts: Solidity, Ethereum, contract development
   - Cryptocurrencies: Bitcoin, Ethereum, tokens, wallets
   - Consensus Algorithms: PoW, PoS, PBFT, practical implementations
   - DeFi: Decentralized finance, DApps, Web3
   - Security: Smart contract vulnerabilities, attack vectors
   - Use Cases: Supply chain, identity, NFTs, enterprise blockchain
   
   DIFFICULTY-SPECIFIC FOCUS (${difficulty}):
   ${difficulty === 'beginner' ? '- Blockchain basics\n   - How Bitcoin works\n   - Basic cryptography\n   - Wallet concepts' : ''}
   ${difficulty === 'intermediate' ? '- Smart contract basics\n   - Ethereum platform\n   - Token standards (ERC-20)\n   - DApp development' : ''}
   ${difficulty === 'advanced' ? '- Advanced smart contracts\n   - Consensus mechanisms\n   - Scalability solutions\n   - Enterprise blockchain' : ''}
   
   EXAMPLE QUESTION FORMATS:
   - "Explain how [blockchain concept] works"
   - "Implement a smart contract for [use case]"
   - "Compare [Blockchain Platform A] vs [Blockchain Platform B]"
   - "Design a blockchain solution for [business problem]"`
    };

    return guidance[subject.toLowerCase()] || guidance['general'];
  }

  // Generate interview questions based on user profile and resume
  async generateInterviewQuestions(userProfile, resumeData, interviewType, subject, difficulty, count = 10, previousQuestions = []) {
    try {
      // Check if Gemini API key is configured
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
        console.log('Using mock questions for development (no Gemini API key configured)');
        // Return mock questions for development
        return this.generateMockQuestions(interviewType, subject, difficulty, count, previousQuestions);
      }
      
      const prompt = this.buildQuestionGenerationPrompt(userProfile, resumeData, interviewType, subject, difficulty, count, previousQuestions);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseQuestions(text);
    } catch (error) {
      console.log('Gemini API error, falling back to mock questions:', error.message);
      // Fallback to mock questions
      return this.generateMockQuestions(interviewType, subject, difficulty, count, previousQuestions);
    }
  }

  // Lightweight local heuristic resume analysis used when LLM is unavailable
  generateLocalResumeAnalysis(resumeText, targetJob) {
    const text = (resumeText || '').toString();
    const lc = text.toLowerCase();
    const lengthScore = Math.max(20, Math.min(100, Math.round((text.length / 2000) * 100)));
    const bulletCount = (text.match(/[\n\r][\-*•]/g) || []).length;
    const hasSections = ['experience', 'education', 'skills', 'projects', 'summary'].filter(k => lc.includes(k)).length;
    const structure = Math.min(100, 40 + hasSections * 12 + Math.min(20, bulletCount * 2));
    const impact = Math.min(100, Math.round((text.match(/%|increase|decrease|reduced|grew|improved|saved|achieved/gi) || []).length * 8 + 40));
    const content = Math.round((structure * 0.3 + impact * 0.4 + lengthScore * 0.3));

    // Simple keyword set
    const baseKeywords = ['javascript', 'react', 'node', 'api', 'sql', 'python', 'aws'];
    const targetKeywords = Array.isArray(targetJob?.keywords) ? targetJob.keywords.map(k => k.toLowerCase()) : [];
    const combinedKeywords = Array.from(new Set([...baseKeywords, ...targetKeywords])).slice(0, 20);
    const found = [];
    const missing = [];
    combinedKeywords.forEach(k => {
      const count = (lc.match(new RegExp(`\\b${k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g')) || []).length;
      if (count > 0) {
        found.push({ keyword: k, count, context: [] });
      } else {
        missing.push({ keyword: k, importance: 'medium', suggestion: `Consider adding ${k} if relevant.` });
      }
    });
    const keywordsScore = Math.round((found.length / Math.max(1, combinedKeywords.length)) * 100);

    const atsIssues = [];
    if (text.match(/\t{2,}/)) atsIssues.push('Potential tab-based layout may confuse parsers');
    if (text.length < 500) atsIssues.push('Resume is very short; parsers may find little content');
    const atsScore = Math.max(30, Math.min(100, 60 + (hasSections - 2) * 8 - (atsIssues.length * 10)));

    const scores = {
      structure: Math.max(0, Math.min(100, structure)),
      content: Math.max(0, Math.min(100, content)),
      impact: Math.max(0, Math.min(100, impact)),
      keywords: Math.max(0, Math.min(100, keywordsScore))
    };
    const overall = Math.round(scores.structure * 0.25 + scores.content * 0.3 + scores.impact * 0.25 + scores.keywords * 0.2);

    return {
      overallScore: overall,
      scores,
      ats: {
        score: Math.max(0, Math.min(100, atsScore)),
        reasons: atsIssues,
        keywordMatchPercent: keywordsScore,
        parsingIssues: atsIssues
      },
      feedback: {
        strengths: [
          { category: 'Structure', points: hasSections >= 3 ? ['Includes common resume sections'] : [] },
          { category: 'Impact', points: impact > 60 ? ['Uses impact language/metrics'] : [] }
        ].filter(s => s.points.length > 0),
        weaknesses: [
          { category: 'Content', points: content < 60 ? ['Add details and quantify achievements'] : [] }
        ].filter(w => w.points.length > 0),
        suggestions: [
          { category: 'Keywords', priority: 'medium', suggestions: ['Align keywords with the target role'] }
        ]
      },
      corrections: [],
      advice: ['Quantify outcomes with numbers', 'Use clear, scannable bullet points'],
      keywordAnalysis: { found, missing },
      industryMatch: { score: 60, matchedIndustries: [], recommendations: [] }
    };
  }
  
  // Transcribe audio URL (placeholder: instructs LLM; replace with dedicated STT service for production)
  async transcribeAudioFromUrl(audioUrl) {
    try {
      const prompt = `You are a speech-to-text assistant. The user has provided an audio recording URL: ${audioUrl}. You cannot fetch the audio directly. Respond with a JSON object with a single field "transcript" containing a best-effort transcript if known, or an empty string with a note that the server cannot fetch media in this environment.`;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return parsed.transcript || '';
      }
      return '';
    } catch (e) {
      return '';
    }
  }

  // Analyze user's answer to interview questions
  async analyzeAnswer(question, answer, expectedKeywords = []) {
    try {
      const prompt = this.buildAnswerAnalysisPrompt(question, answer, expectedKeywords);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseAnswerAnalysis(text);
    } catch (error) {
      console.error('Error analyzing answer:', error);
      throw new Error('Failed to analyze answer');
    }
  }

  /**
   * Analyze answer with video and audio analysis data
   * Provides comprehensive multimodal feedback
   */
  async analyzeAnswerWithMedia(question, answer, videoAnalysis = null, audioAnalysis = null, expectedKeywords = []) {
    try {
      const prompt = this.buildMultimodalAnalysisPrompt(question, answer, videoAnalysis, audioAnalysis, expectedKeywords);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseAnswerAnalysis(text);
    } catch (error) {
      console.error('Error analyzing answer with media:', error);
      // Fallback to basic analysis
      return this.analyzeAnswer(question, answer, expectedKeywords);
    }
  }

  /**
   * Generate correct answer and evaluate user's answer correctness
   */
  async evaluateAnswerCorrectness(question, userAnswer, questionCategory, difficulty, subject = 'general') {
    try {
      const prompt = this.buildCorrectnessEvaluationPrompt(question, userAnswer, questionCategory, difficulty, subject);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseCorrectnessEvaluation(text);
    } catch (error) {
      console.error('Error evaluating correctness:', error);
      // Provide intelligent fallback based on answer analysis
      const answerLength = userAnswer.length;
      const wordCount = userAnswer.split(/\s+/).length;
      
      // Basic scoring based on answer quality indicators
      let baseScore = 50; // Start with passing score
      
      // Adjust based on length and detail
      if (answerLength > 200) baseScore += 15;
      else if (answerLength > 100) baseScore += 10;
      else if (answerLength < 50) baseScore -= 20;
      
      // Adjust based on word count (more words = more detail)
      if (wordCount > 50) baseScore += 10;
      else if (wordCount > 30) baseScore += 5;
      
      // Check for code-like patterns or technical terms
      const hasTechnicalIndicators = /\b(function|class|const|let|var|async|await|return|if|else|for|while)\b/i.test(userAnswer);
      if (hasTechnicalIndicators && questionCategory === 'technical') baseScore += 10;
      
      // Check for structured formatting (numbered lists, bullet points)
      const hasStructure = /(\d+\.|\n-|\n\*|Definition:|Example:)/i.test(userAnswer);
      if (hasStructure) baseScore += 5;
      
      // Cap the score
      const finalScore = Math.min(Math.max(baseScore, 30), 75); // Between 30-75
      
      // Subject-specific key points
      let subjectSpecificPoints = [];
      if (questionCategory === 'technical') {
        if (question.toLowerCase().includes('dsa') || question.toLowerCase().includes('algorithm') || question.toLowerCase().includes('data structure')) {
          subjectSpecificPoints = [
            'Algorithmic approach and logic',
            'Time and space complexity analysis',
            'Edge case handling',
            'Code implementation details'
          ];
        } else if (question.toLowerCase().includes('java')) {
          subjectSpecificPoints = [
            'Java-specific syntax and features',
            'Object-oriented programming concepts',
            'Exception handling',
            'Collections framework usage'
          ];
        } else if (question.toLowerCase().includes('python')) {
          subjectSpecificPoints = [
            'Python-specific syntax and features',
            'Data structures and libraries',
            'Error handling',
            'Pythonic coding practices'
          ];
        } else if (question.toLowerCase().includes('javascript')) {
          subjectSpecificPoints = [
            'JavaScript-specific syntax and features',
            'Asynchronous programming concepts',
            'DOM manipulation',
            'Modern ES6+ features'
          ];
        } else {
          subjectSpecificPoints = [
            'Technical accuracy',
            'Problem-solving approach',
            'Best practices',
            'Code quality'
          ];
        }
      } else {
        subjectSpecificPoints = [
          'Clear explanation of the concept',
          'Practical examples or use cases',
          'Comparison or contrast with related concepts',
          'Relevance to the question'
        ];
      }
      
      return {
        correctAnswer: 'AI evaluation temporarily unavailable. Your answer has been scored based on content analysis.',
        keyPoints: subjectSpecificPoints,
        isCorrect: finalScore >= 50, // Consider correct if 50+
        correctnessScore: finalScore,
        keyPointsCovered: [
          answerLength > 100 ? 'Provided detailed explanation' : 'Attempted to explain the concept',
          hasStructure ? 'Used structured formatting' : 'Provided answer content',
          hasTechnicalIndicators ? 'Included technical terminology' : 'Addressed the question'
        ],
        keyPointsMissed: [
          answerLength < 100 ? 'Could provide more detailed explanation' : null,
          !hasStructure ? 'Consider using structured formatting (numbered points)' : null,
          wordCount < 30 ? 'Add more depth and examples' : null
        ].filter(Boolean),
        mistakesMade: answerLength < 20 ? ['Answer is too brief for proper evaluation'] : [],
        improvementAreas: [
          {
            area: 'Content Depth',
            priority: answerLength < 100 ? 'high' : 'medium',
            suggestion: 'Expand your answer with more details, examples, and explanations',
            impact: 'Demonstrates comprehensive understanding of the topic'
          },
          {
            area: 'Structure',
            priority: 'medium',
            suggestion: 'Use clear formatting with numbered points or sections',
            impact: 'Makes your answer easier to follow and more professional'
          }
        ]
      };
    }
  }

  /**
   * Build correctness evaluation prompt
   */
  buildCorrectnessEvaluationPrompt(question, userAnswer, questionCategory, difficulty, subject = 'general') {
    return `
You are an expert interview evaluator. Evaluate the correctness of a candidate's answer and provide the ideal answer.

QUESTION: ${question}
CATEGORY: ${questionCategory}
SUBJECT: ${subject}
DIFFICULTY: ${difficulty}

CANDIDATE'S ANSWER:
${userAnswer}

EVALUATE THE ANSWER:
1. Generate the CORRECT/IDEAL answer to this question
2. Identify key points that should be covered
3. Determine which key points the candidate covered
4. Identify which key points the candidate missed
5. Identify any mistakes or incorrect information
6. Calculate a correctness score (0-100)
7. Determine if the answer is fundamentally correct (true/false)
8. Provide specific improvement areas with priority levels

FORMAT YOUR RESPONSE AS JSON:
{
  "correctAnswer": "The ideal, comprehensive answer to the question. Should be detailed and well-structured.",
  "keyPoints": [
    "First key point that should be covered",
    "Second key point that should be covered",
    "Third key point that should be covered"
  ],
  "isCorrect": true,
  "correctnessScore": 75,
  "keyPointsCovered": [
    "Points that the candidate successfully covered"
  ],
  "keyPointsMissed": [
    "Important points that the candidate missed"
  ],
  "mistakesMade": [
    "Specific errors or incorrect statements made"
  ],
  "improvementAreas": [
    {
      "area": "Technical Accuracy",
      "priority": "high",
      "suggestion": "Review the concept of X and understand how it differs from Y",
      "impact": "This is a fundamental concept that interviewers expect candidates to know"
    },
    {
      "area": "Completeness",
      "priority": "medium",
      "suggestion": "Include discussion of edge cases and error handling",
      "impact": "Demonstrates thorough understanding and attention to detail"
    }
  ]
}

IMPORTANT:
- Be specific and constructive in feedback
- Correctness score should reflect factual accuracy, not just completeness
- Priority levels: critical (fundamental errors), high (important gaps), medium (nice to have), low (minor improvements)
- The correct answer should be what you would expect from a strong candidate
- For DSA questions, focus on algorithmic correctness, time/space complexity, and edge cases
- For programming language questions, focus on syntax, best practices, and language-specific features
- For system design questions, focus on scalability, architecture patterns, and distributed systems concepts
    `;
  }

  /**
   * Parse correctness evaluation response
   */
  parseCorrectnessEvaluation(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Ensure all required fields exist with reasonable defaults
      const correctnessScore = parsed.correctnessScore !== undefined 
        ? Math.max(0, Math.min(100, parsed.correctnessScore)) 
        : 50; // Default to 50 if missing
      
      return {
        correctAnswer: parsed.correctAnswer || 'Unable to generate correct answer.',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        isCorrect: parsed.isCorrect !== undefined ? parsed.isCorrect : correctnessScore >= 50,
        correctnessScore: correctnessScore,
        keyPointsCovered: Array.isArray(parsed.keyPointsCovered) ? parsed.keyPointsCovered : [],
        keyPointsMissed: Array.isArray(parsed.keyPointsMissed) ? parsed.keyPointsMissed : [],
        mistakesMade: Array.isArray(parsed.mistakesMade) ? parsed.mistakesMade : [],
        improvementAreas: Array.isArray(parsed.improvementAreas) ? parsed.improvementAreas : []
      };
    } catch (error) {
      console.error('Error parsing correctness evaluation:', error);
      // Return a reasonable default instead of 0
      return {
        correctAnswer: 'Unable to parse evaluation results.',
        keyPoints: ['Response structure', 'Technical accuracy', 'Completeness'],
        isCorrect: true, // Assume correct by default when can't parse
        correctnessScore: 60, // Give benefit of doubt
        keyPointsCovered: ['Provided an answer'],
        keyPointsMissed: ['Detailed evaluation unavailable'],
        mistakesMade: [],
        improvementAreas: [
          {
            area: 'Evaluation',
            priority: 'medium',
            suggestion: 'Automatic evaluation failed - manual review recommended',
            impact: 'Ensures accurate feedback'
          }
        ]
      };
    }
  }

  /**
   * Build multimodal analysis prompt including video and audio insights
   */
  buildMultimodalAnalysisPrompt(question, answer, videoAnalysis, audioAnalysis, expectedKeywords) {
    let mediaInsights = '\n\nMEDIA ANALYSIS INSIGHTS:\n';

    if (videoAnalysis) {
      mediaInsights += `\nVIDEO ANALYSIS:\n`;
      mediaInsights += `- Eye Contact: ${videoAnalysis.eyeContact.score}/100 (${videoAnalysis.eyeContact.percentage}% maintained)\n`;
      mediaInsights += `- Facial Confidence: ${videoAnalysis.facialExpressions.confidence}/100\n`;
      mediaInsights += `- Engagement: ${videoAnalysis.facialExpressions.engagement}/100\n`;
      mediaInsights += `- Stress Level: ${videoAnalysis.facialExpressions.stress}/100\n`;
      mediaInsights += `- Body Language Posture: ${videoAnalysis.bodyLanguage.posture}/100\n`;
      mediaInsights += `- Gestures: ${videoAnalysis.bodyLanguage.gestures}/100\n`;
    }

    if (audioAnalysis) {
      mediaInsights += `\nAUDIO ANALYSIS:\n`;
      mediaInsights += `- Speech Clarity: ${audioAnalysis.speechClarity}/100\n`;
      mediaInsights += `- Speaking Pace: ${audioAnalysis.pace.wordsPerMinute} WPM (${audioAnalysis.pace.rating})\n`;
      mediaInsights += `- Vocal Confidence: ${audioAnalysis.tone.confidence}/100\n`;
      mediaInsights += `- Enthusiasm: ${audioAnalysis.tone.enthusiasm}/100\n`;
      mediaInsights += `- Professionalism: ${audioAnalysis.tone.professionalism}/100\n`;
      mediaInsights += `- Filler Words: ${audioAnalysis.fillerWords.count} instances (${audioAnalysis.fillerWords.types.join(', ')})\n`;
      mediaInsights += `- Pauses: ${audioAnalysis.pauses.count} pauses, average ${audioAnalysis.pauses.averageDuration.toFixed(1)}s\n`;
    }

    return `
You are an expert interview evaluator with expertise in both content and presentation analysis. 
Analyze the following interview answer considering BOTH the content AND the delivery.

QUESTION: ${question}

ANSWER (CONTENT): ${answer}

EXPECTED KEYWORDS: ${expectedKeywords.join(', ')}
${mediaInsights}

EVALUATE THE ANSWER HOLISTICALLY:
1. Content Quality (0-100): Relevance, accuracy, completeness, examples
2. Clarity (0-100): Structure, coherence, articulation
3. Delivery (0-100): Confidence, engagement, professionalism (based on video/audio)
4. Technical Accuracy (0-100): Correctness of technical details
5. Overall Presentation (0-100): Combined impact of content and delivery

PROVIDE INTEGRATED FEEDBACK:
- Consider how verbal content aligns with non-verbal delivery
- Note any discrepancies between what was said and how it was delivered
- Evaluate the overall professional impression
- Provide specific, actionable suggestions for improvement

FORMAT YOUR RESPONSE AS JSON:
{
  "score": 85,
  "confidence": 80,
  "relevance": 85,
  "clarity": 80,
  "delivery": 75,
  "feedback": {
    "strengths": [
      "Clear and well-structured response",
      "Strong eye contact maintained throughout",
      "Confident vocal delivery"
    ],
    "weaknesses": [
      "Could provide more specific examples",
      "Some filler words detected",
      "Speaking pace slightly fast"
    ],
    "suggestions": [
      "Practice reducing 'um' and 'like' filler words",
      "Add concrete examples with metrics",
      "Slow down slightly for better impact",
      "Maintain the good eye contact and posture"
    ]
  },
  "keywords": {
    "found": ["keyword1", "keyword2"],
    "missing": ["keyword3", "keyword4"]
  },
  "presentationScore": {
    "verbal": 80,
    "nonVerbal": 75,
    "overall": 77
  }
}
    `;
  }

  // Analyze resume content and structure
  async analyzeResume(resumeText, targetJob = null) {
    try {
      // Fallback to local heuristic analysis if API key missing
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
        return this.generateLocalResumeAnalysis(resumeText, targetJob);
      }

      const prompt = this.buildResumeAnalysisPrompt(resumeText, targetJob);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return this.parseResumeAnalysis(text);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      // As a safety net, return local analysis instead of failing hard
      return this.generateLocalResumeAnalysis(resumeText, targetJob);
    }
  }

  // Generate resume improvement suggestions
  async generateResumeSuggestions(resumeAnalysis, targetJob) {
    try {
      const prompt = this.buildResumeSuggestionsPrompt(resumeAnalysis, targetJob);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseResumeSuggestions(text);
    } catch (error) {
      console.error('Error generating resume suggestions:', error);
      throw new Error('Failed to generate resume suggestions');
    }
  }

  // Build question generation prompt
  buildQuestionGenerationPrompt(userProfile, resumeData, interviewType, subject, difficulty, count, previousQuestions = []) {
    const timestamp = new Date().toISOString();
    const randomSeed = Math.random().toString(36).substring(7);
    
    // Extract detailed resume information
    const resumeSummary = resumeData ? this.extractResumeSummary(resumeData) : 'No resume data available';
    const skills = this.extractSkills(resumeData);
    const experiences = this.extractExperiences(resumeData);
    const education = this.extractEducation(resumeData);
    
    // Get previous questions to avoid repetition
    const previousQuestionsText = previousQuestions.length > 0 
      ? '\n\nPREVIOUSLY ASKED QUESTIONS (DO NOT REPEAT OR CLOSELY REPLICATE):\n' + previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')
      : '';
    
    // Enhanced job role and industry information
    const targetJobRole = userProfile.profile?.jobTitle || 'Not specified';
    const targetIndustry = userProfile.profile?.industry || 'general';
    const experienceLevel = userProfile.profile?.experienceLevel || 'entry';
    
    // Create a more detailed job role context
    const jobRoleContext = targetJobRole !== 'Not specified' 
      ? `${targetJobRole} in the ${targetIndustry} industry with ${experienceLevel} experience level`
      : `a professional in the ${targetIndustry} industry with ${experienceLevel} experience level`;
    
    // Create role-specific guidance based on common job roles
    let roleSpecificGuidance = '';
    if (targetJobRole !== 'Not specified') {
      if (targetJobRole.toLowerCase().includes('software') || targetJobRole.toLowerCase().includes('developer') || targetJobRole.toLowerCase().includes('engineer')) {
        roleSpecificGuidance = `
- Focus on software development concepts, programming languages, frameworks, and tools relevant to the candidate's experience
- Include questions about coding challenges, system design, debugging, and software architecture
- Consider the candidate's experience level when determining technical depth`;
      } else if (targetJobRole.toLowerCase().includes('manager') || targetJobRole.toLowerCase().includes('lead')) {
        roleSpecificGuidance = `
- Emphasize leadership, team management, and strategic decision-making scenarios
- Include questions about project management, conflict resolution, and resource allocation
- Focus on people management and organizational skills`;
      } else if (targetJobRole.toLowerCase().includes('data') || targetJobRole.toLowerCase().includes('analyst')) {
        roleSpecificGuidance = `
- Focus on data analysis, statistics, and data visualization concepts
- Include questions about tools like SQL, Python, R, or data platforms
- Consider business intelligence and data-driven decision making`;
      } else if (targetJobRole.toLowerCase().includes('product')) {
        roleSpecificGuidance = `
- Emphasize product strategy, user experience, and market analysis
- Include questions about product lifecycle, prioritization, and stakeholder management
- Focus on cross-functional collaboration and product development`;
      } else if (targetJobRole.toLowerCase().includes('design') || targetJobRole.toLowerCase().includes('ux') || targetJobRole.toLowerCase().includes('ui')) {
        roleSpecificGuidance = `
- Focus on design principles, user experience, and creative problem-solving
- Include questions about design tools, prototyping, and user research
- Consider portfolio and design process questions`;
      } else {
        roleSpecificGuidance = `
- Tailor questions to the specific responsibilities and skills required for this role
- Consider industry-specific challenges and best practices
- Align with the candidate's experience level and career progression`;
      }
    }
    
    return `
You are an expert interview coach with deep expertise in personalized candidate assessment. Generate ${count} UNIQUE and HIGHLY PERSONALIZED interview questions.

🎯 CRITICAL REQUIREMENT: Every question MUST be unique and specifically tailored to this candidate's profile. DO NOT use generic templates.

CANDIDATE PROFILE:
- Name: ${userProfile.firstName} ${userProfile.lastName}
- Industry: ${targetIndustry}
- Experience Level: ${experienceLevel}
- Current Job Title: ${targetJobRole}
- Company: ${userProfile.profile?.company || 'Not specified'}
- Location: ${userProfile.profile?.location || 'Not specified'}

DETAILED RESUME ANALYSIS:
${resumeSummary}

KEY SKILLS IDENTIFIED:
${skills.length > 0 ? skills.join(', ') : 'General skills'}

PROFESSIONAL EXPERIENCE:
${experiences}

EDUCATION BACKGROUND:
${education}

INTERVIEW REQUIREMENTS:
- Type: ${interviewType}
- Subject: ${subject}
- Difficulty: ${difficulty}
- Target Job Role: ${jobRoleContext}
- Question Count: ${count}
- Session ID: ${randomSeed}
- Generation Time: ${timestamp}
${previousQuestionsText}

📋 QUESTION GENERATION INSTRUCTIONS:

1. **PERSONALIZATION**: 
   - Reference specific technologies, projects, or experiences from the resume
   - Tailor difficulty to the candidate's experience level (${experienceLevel})
   - Consider the candidate's industry (${targetIndustry}) and job role (${targetJobRole})
   - Align questions with the specific skills and responsibilities of a ${targetJobRole}

2. **ROLE-SPECIFIC FOCUS**:
${roleSpecificGuidance || '  - Create questions that align with the responsibilities and skills required for this role'}

3. **UNIQUENESS**: 
   - Each question must be contextually different from previous questions
   - Vary question formats: scenario-based, problem-solving, conceptual, practical
   - Use different aspects of their background for each question
   - Avoid repetitive patterns or templates

4. **DIFFICULTY MAPPING**:
   - Beginner: Foundational concepts, basic scenarios, entry-level expectations
   - Intermediate: Practical applications, trade-offs, real-world problem-solving
   - Advanced: System design, architecture decisions, leadership scenarios, complex optimizations

5. **TYPE-SPECIFIC GUIDELINES**:
   - **Technical**: Focus on specific technologies/frameworks from resume, coding problems, system architecture
   - **Behavioral**: Use STAR method, reference actual experiences they might have had
   - **Case**: Industry-specific business problems, data-driven decision making
   - **System-Design**: Scale and complexity appropriate to experience level
   - **General**: Career goals, motivation, cultural fit based on their background
   - **Mixed**: Combine technical depth with behavioral insights

6. **CONTEXT AWARENESS**:
   - If the candidate has experience in ${targetIndustry}, ask domain-specific questions relevant to that industry
   - Reference their skill set: ${skills.slice(0, 5).join(', ') || 'their listed skills'}
   - Consider their career trajectory and current role as a ${targetJobRole}
   - Focus on challenges and responsibilities typical for a ${targetJobRole} position
   - Match the technical depth and specialization to their experience level (${experienceLevel})

7. **SKILL ALIGNMENT**:
   - For each question, explicitly connect it to skills or experiences from their resume
   - If they have experience with specific technologies, ask questions that leverage that knowledge
   - If they've held leadership roles, include questions about management and team dynamics
   - If they've worked on significant projects, ask detailed questions about those experiences
   - Ensure questions build on their existing knowledge rather than ignoring it

8. **TARGET JOB ROLE EMPHASIS**:
   - All questions must be directly relevant to the ${targetJobRole} position
   - Consider the core competencies required for this role:
     * Technical skills specific to ${targetJobRole}
     * Soft skills important for ${targetJobRole}
     * Industry knowledge relevant to ${targetIndustry}
     * Problem-solving approaches used in this role
   - Frame questions in the context of real-world challenges someone in this role would face
   - Reference specific responsibilities or tasks associated with ${targetJobRole}

9. **🚨 CRITICAL: SUBJECT-SPECIFIC REQUIREMENTS**:
   ⚠️ MANDATORY: ALL ${count} QUESTIONS MUST BE EXCLUSIVELY ABOUT '${subject.toUpperCase()}'
   ⚠️ DO NOT include questions from other subjects or general topics
   ⚠️ If subject is 'general', you may mix topics, otherwise STRICTLY focus on the specified subject
   
   SUBJECT: '${subject}'
   
   ${this.getSubjectSpecificGuidance(subject, difficulty)}
   
   VALIDATION CHECKLIST:
   ✓ Each question directly relates to ${subject}
   ✓ No questions from unrelated topics
   ✓ Technical terms and concepts are ${subject}-specific
   ✓ Examples and scenarios are ${subject}-relevant
   ✓ Expected keywords are ${subject}-focused

FORMAT YOUR RESPONSE AS JSON:
{
  "questions": [
    {
      "questionId": "unique_id_based_on_content",
      "question": "Detailed, personalized question that references specific aspects of the candidate's background",
      "category": "technical|behavioral|case|system-design|general",
      "difficulty": "easy|medium|hard",
      "expectedKeywords": ["keyword1", "keyword2", "keyword3"],
      "timeLimit": 120,
      "personalizationContext": "Brief note on why this question is relevant to this candidate"
    }
  ]
}

⚠️ IMPORTANT: 
- NO generic questions like "Tell me about yourself" or "What are your strengths?"
- Each question should feel like it was crafted specifically for THIS candidate
- Demonstrate that you've analyzed their resume and background
- Ensure maximum diversity across all ${count} questions
- Questions must be relevant to the ${targetJobRole} role in the ${targetIndustry} industry
- Each question must include a personalizationContext explaining why it's relevant to their specific background
- Every question must directly relate to the skills, experiences, or challenges of a ${targetJobRole}
    `;
  }

  // Build answer analysis prompt
  buildAnswerAnalysisPrompt(question, answer, expectedKeywords) {
    return `
You are an expert interview evaluator. Analyze the following answer to an interview question:

QUESTION: ${question}

ANSWER: ${answer}

EXPECTED KEYWORDS: ${expectedKeywords.join(', ')}

EVALUATE THE ANSWER BASED ON:
1. Relevance (0-100): How well does the answer address the question?
2. Clarity (0-100): How clear and well-structured is the response?
3. Confidence (0-100): How confident and assured does the candidate sound?
4. Technical Accuracy (0-100): How accurate are the technical details?
5. Completeness (0-100): How complete is the answer?

PROVIDE:
- Overall score (0-100)
- Specific feedback on strengths and weaknesses
- Suggestions for improvement
- Keywords found and missing

FORMAT YOUR RESPONSE AS JSON:
{
  "score": 85,
  "feedback": {
    "strengths": ["Clear structure", "Good examples"],
    "weaknesses": ["Could be more specific", "Missing technical details"],
    "suggestions": ["Add more specific examples", "Include technical details"]
  },
  "keywords": {
    "found": ["keyword1", "keyword2"],
    "missing": ["keyword3", "keyword4"]
  },
  "confidence": 75,
  "relevance": 80,
  "clarity": 85
}
    `;
  }

  // Build resume analysis prompt
  buildResumeAnalysisPrompt(resumeText, targetJob) {
    return `
You are an expert resume analyzer. Analyze the following resume:

RESUME CONTENT:
${resumeText}

TARGET JOB: ${targetJob ? JSON.stringify(targetJob) : 'Not specified'}

ANALYZE THE RESUME FOR:
1. Structure and Format (0-100): organization, readability, consistency.
2. Content Quality (0-100): relevance, clarity, seniority signal.
3. Impact and Achievements (0-100): quantified results, action verbs.
4. Keyword Optimization (0-100): match to role/industry keywords.
5. ATS Compatibility (0-100): parsability by Applicant Tracking Systems.

PROVIDE:
- Overall score (0-100)
- Detailed feedback on strengths and weaknesses
- Specific, line-level corrections (quote the problematic text and propose improved version)
- Actionable advice items (short bullet points)
- Keyword analysis (found and missing)
- Industry match score
- ATS section: ats.score, ats.reasons[], ats.keywordMatchPercent (0-100), ats.parsingIssues[]

FORMAT YOUR RESPONSE AS JSON:
{
  "overallScore": 75,
  "scores": {
    "structure": 80,
    "content": 70,
    "impact": 75,
    "keywords": 65
  },
  "ats": {
    "score": 68,
    "reasons": ["Uses tables which some ATS fail to parse", "Two-column layout"],
    "keywordMatchPercent": 62,
    "parsingIssues": ["Header contact info embedded in image"]
  },
  "feedback": {
    "strengths": [
      {"category": "Structure", "points": ["Clean layout", "Good organization"]}
    ],
    "weaknesses": [
      {"category": "Content", "points": ["Vague descriptions", "Missing quantifiable achievements"]}
    ],
    "suggestions": [
      {"category": "Content", "priority": "high", "suggestions": ["Add specific metrics", "Quantify achievements"]}
    ]
  },
  "corrections": [
    {"section": "Experience", "before": "Responsible for sales", "after": "Increased regional ARR by 24% YoY by ...", "rationale": "Quantify outcomes and use action verbs"}
  ],
  "advice": ["Use a single-column layout", "Move skills above experience if junior"],
  "keywordAnalysis": {
    "found": [{"keyword": "JavaScript", "count": 3, "context": ["Frontend development", "Web applications"]}],
    "missing": [{"keyword": "React", "importance": "high", "suggestion": "Add React experience if applicable"}]
  },
  "industryMatch": {
    "score": 70,
    "matchedIndustries": ["Technology", "Software Development"],
    "recommendations": ["Focus on technical skills", "Add more project examples"]
  }
}
    `;
  }

  // Build resume suggestions prompt
  buildResumeSuggestionsPrompt(resumeAnalysis, targetJob) {
    return `
Based on the following resume analysis, provide specific improvement suggestions:

RESUME ANALYSIS:
${JSON.stringify(resumeAnalysis, null, 2)}

TARGET JOB: ${targetJob ? JSON.stringify(targetJob) : 'Not specified'}

PROVIDE SPECIFIC, ACTIONABLE SUGGESTIONS FOR:
1. Content improvements
2. Structure enhancements
3. Keyword optimization
4. Achievement quantification
5. Industry alignment

FORMAT YOUR RESPONSE AS JSON:
{
  "suggestions": [
    {
      "category": "Content",
      "priority": "high",
      "suggestions": [
        "Add specific metrics to achievements",
        "Include more technical skills",
        "Quantify project impacts"
      ]
    }
  ],
  "priorityActions": [
    "Update job descriptions with quantifiable achievements",
    "Add missing technical skills",
    "Improve summary section"
  ]
}
    `;
  }

  // Extract skills from resume data
  extractSkills(resumeData) {
    if (!resumeData) return [];
    
    const skills = [];
    
    // Extract from skills section
    if (resumeData.skills && Array.isArray(resumeData.skills)) {
      resumeData.skills.forEach(skill => {
        if (typeof skill === 'string') {
          skills.push(skill);
        } else if (skill.name) {
          skills.push(skill.name);
        }
      });
    }
    
    // Extract from experience section
    if (resumeData.experiences && Array.isArray(resumeData.experiences)) {
      resumeData.experiences.forEach(exp => {
        if (exp.skills && Array.isArray(exp.skills)) {
          exp.skills.forEach(skill => {
            if (typeof skill === 'string' && !skills.includes(skill)) {
              skills.push(skill);
            }
          });
        }
        if (exp.technologies && Array.isArray(exp.technologies)) {
          exp.technologies.forEach(tech => {
            if (typeof tech === 'string' && !skills.includes(tech)) {
              skills.push(tech);
            }
          });
        }
      });
    }
    
    return skills.slice(0, 20); // Limit to 20 skills
  }

  // Extract experiences from resume data
  extractExperiences(resumeData) {
    if (!resumeData || !resumeData.experiences) return 'No professional experience listed';
    
    if (!Array.isArray(resumeData.experiences)) {
      return String(resumeData.experiences);
    }
    
    if (resumeData.experiences.length === 0) {
      return 'No professional experience listed';
    }
    
    return resumeData.experiences.map((exp, index) => {
      const start = exp.startDate ? new Date(exp.startDate).getFullYear() : 'Unknown';
      const end = exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present';
      const duration = `${start} - ${end}`;
      
      return `${index + 1}. ${exp.title || 'Unnamed Role'} at ${exp.company || 'Unnamed Company'} (${duration})
         ${exp.description ? `- ${exp.description.substring(0, 200)}${exp.description.length > 200 ? '...' : ''}` : ''}`;
    }).join('\n');
  }

  // Extract education from resume data
  extractEducation(resumeData) {
    if (!resumeData || !resumeData.education) return 'No education information provided';
    
    if (!Array.isArray(resumeData.education)) {
      return String(resumeData.education);
    }
    
    if (resumeData.education.length === 0) {
      return 'No education information provided';
    }
    
    return resumeData.education.map((edu, index) => {
      const year = edu.graduationYear || (edu.endDate ? new Date(edu.endDate).getFullYear() : 'Unknown');
      return `${index + 1}. ${edu.degree || 'Degree'} in ${edu.fieldOfStudy || 'Field of Study'} from ${edu.institution || 'Institution'} (${year})`;
    }).join('\n');
  }

  // Extract resume summary
  extractResumeSummary(resumeData) {
    if (!resumeData) return 'No resume data available';
    
    const skills = this.extractSkills(resumeData);
    const experiences = this.extractExperiences(resumeData);
    const education = this.extractEducation(resumeData);
    
    // Get user's target job role if available
    const targetJobRole = resumeData.metadata?.targetJobRole || resumeData.targetJobRole || 'Not specified';
    const targetIndustry = resumeData.metadata?.targetIndustry || resumeData.targetIndustry || 'general';
    
    return `
TARGET JOB ROLE: ${targetJobRole}
TARGET INDUSTRY: ${targetIndustry}

KEY SKILLS:
${skills.length > 0 ? skills.slice(0, 10).join(', ') : 'No specific skills listed'}

PROFESSIONAL EXPERIENCE:
${experiences}

EDUCATION:
${education}
    `.trim();
  }

  // Parse questions from AI response
  parseQuestions(text) {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.questions || [];
    } catch (error) {
      console.error('Error parsing questions:', error);
      return [];
    }
  }

  // Parse answer analysis from AI response
  parseAnswerAnalysis(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Ensure scores are never 0 by default - use reasonable values
      return {
        score: parsed.score !== undefined ? Math.max(30, Math.min(100, parsed.score)) : 55,
        feedback: {
          strengths: Array.isArray(parsed.feedback?.strengths) ? parsed.feedback.strengths : ['Provided a response'],
          weaknesses: Array.isArray(parsed.feedback?.weaknesses) ? parsed.feedback.weaknesses : [],
          suggestions: Array.isArray(parsed.feedback?.suggestions) ? parsed.feedback.suggestions : ['Consider adding more details']
        },
        keywords: {
          found: Array.isArray(parsed.keywords?.found) ? parsed.keywords.found : [],
          missing: Array.isArray(parsed.keywords?.missing) ? parsed.keywords.missing : []
        },
        confidence: parsed.confidence !== undefined ? Math.max(30, Math.min(100, parsed.confidence)) : 55,
        relevance: parsed.relevance !== undefined ? Math.max(30, Math.min(100, parsed.relevance)) : 55,
        clarity: parsed.clarity !== undefined ? Math.max(30, Math.min(100, parsed.clarity)) : 55
      };
    } catch (error) {
      console.error('Error parsing answer analysis:', error);
      // Return reasonable default scores instead of 0
      return {
        score: 55, // Give benefit of doubt - passing score
        feedback: { 
          strengths: ['Attempted to answer the question'],
          weaknesses: ['Automated analysis failed - manual review recommended'], 
          suggestions: ['Ensure your answer is clear and well-structured'] 
        },
        keywords: { found: [], missing: [] },
        confidence: 50,
        relevance: 50,
        clarity: 50
      };
    }
  }

  // Parse resume analysis from AI response
  parseResumeAnalysis(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      // Normalize optional fields
      parsed.ats = parsed.ats || { score: 0, reasons: [], keywordMatchPercent: 0, parsingIssues: [] };
      parsed.corrections = parsed.corrections || [];
      parsed.advice = parsed.advice || [];
      parsed.scores = parsed.scores || { structure: 0, content: 0, impact: 0, keywords: 0 };
      return parsed;
    } catch (error) {
      console.error('Error parsing resume analysis:', error);
      return {
        overallScore: 0,
        scores: { structure: 0, content: 0, impact: 0, keywords: 0 },
        ats: { score: 0, reasons: [], keywordMatchPercent: 0, parsingIssues: [] },
        feedback: { strengths: [], weaknesses: [], suggestions: [] },
        corrections: [],
        advice: [],
        keywordAnalysis: { found: [], missing: [] },
        industryMatch: { score: 0, matchedIndustries: [], recommendations: [] }
      };
    }
  }

  // Parse resume suggestions from AI response
  parseResumeSuggestions(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing resume suggestions:', error);
      return {
        suggestions: [],
        priorityActions: []
      };
    }
  }

  // Generate mock questions for development/testing
  generateMockQuestions(interviewType, subject, difficulty, count = 10, previousQuestions = []) {
    const questions = [];
    const questionsBySubject = {
      technical: [
        'Can you explain the difference between synchronous and asynchronous programming?',
        'What is the time complexity of binary search?',
        'How would you implement a stack using an array?',
        'What are the advantages of using a hash table?',
        'Can you describe the MVC architecture pattern?',
        'Explain the difference between REST and GraphQL APIs.',
        'What is the purpose of indexing in databases?',
        'How does garbage collection work in modern programming languages?',
        'What are design patterns and why are they important?',
        'Explain the concept of Big O notation and its importance.',
        'What are the differences between SQL and NoSQL databases?',
        'How would you optimize a slow database query?',
        'Explain the concept of dependency injection.',
        'What is the difference between authentication and authorization?',
        'How do you ensure code quality in your projects?',
        'Explain the SOLID principles in software design.',
        'What is your approach to handling errors and exceptions?',
        'How would you implement caching in a web application?',
        'Explain the concept of microservices architecture.',
        'What are the pros and cons of serverless architecture?',
        'How do you approach API versioning?',
        'Explain the CAP theorem in distributed systems.',
        'What is your experience with containerization (Docker, Kubernetes)?',
        'How would you implement real-time features in an application?',
        'Explain the difference between horizontal and vertical scaling.'
      ],
      dsa: [
        'Explain the difference between an array and a linked list. When would you use each?',
        'Implement a function to reverse a singly linked list.',
        'What is the time complexity of merge sort and how does it work?',
        'Explain the difference between breadth-first search and depth-first search.',
        'How would you detect a cycle in a linked list?',
        'Implement a binary search algorithm.',
        'What is a hash table and how does it handle collisions?',
        'Explain the concept of dynamic programming with an example.',
        'How would you find the longest common subsequence of two strings?',
        'Implement a stack using two queues.',
        'What is the difference between a min-heap and a max-heap?',
        'Explain how quicksort works and its average and worst-case time complexities.',
        'How would you find the kth largest element in an unsorted array?',
        'Implement a function to check if a binary tree is balanced.',
        'What is the difference between a graph and a tree?',
        'Explain the concept of memoization and when to use it.',
        'How would you implement a LRU (Least Recently Used) cache?',
        'What is the time complexity of inserting into a binary search tree?',
        'Explain the difference between backtracking and branch and bound.',
        'How would you find the shortest path in a weighted graph?',
        'Implement a function to find all permutations of a string.',
        'What is the difference between divide and conquer and dynamic programming?',
        'How would you serialize and deserialize a binary tree?',
        'Explain the concept of trie data structure and its use cases.',
        'How would you solve the N-Queens problem?'
      ],
      java: [
        'Explain the difference between == and equals() in Java.',
        'What is the difference between an abstract class and an interface?',
        'How does garbage collection work in Java?',
        'Explain the concept of multithreading in Java.',
        'What is the difference between ArrayList and LinkedList?',
        'Explain the concept of exception handling in Java.',
        'What is the purpose of the finally block in Java?',
        'How does the Java Collections Framework work?',
        'Explain the difference between String, StringBuilder, and StringBuffer.',
        'What is the difference between method overloading and method overriding?',
        'How does the Java Memory Model work?',
        'Explain the concept of generics in Java.',
        'What is the difference between checked and unchecked exceptions?',
        'How does the JVM work?',
        'Explain the concept of synchronization in Java.',
        'What is the difference between a HashMap and a ConcurrentHashMap?',
        'How does the Java Reflection API work?',
        'Explain the concept of lambda expressions in Java 8.',
        'What is the difference between fail-fast and fail-safe iterators?',
        'How does the Java Stream API work?',
        'Explain the concept of annotations in Java.',
        'What is the difference between composition and inheritance?',
        'How does the Java ClassLoader work?',
        'Explain the concept of serialization in Java.',
        'What is the difference between a static and non-static nested class?'
      ],
      python: [
        'Explain the difference between a list and a tuple in Python.',
        'What is the Global Interpreter Lock (GIL) in Python?',
        'How does memory management work in Python?',
        'Explain the concept of decorators in Python.',
        'What is the difference between deep copy and shallow copy?',
        'How does exception handling work in Python?',
        'Explain the concept of generators in Python.',
        'What is the difference between __new__ and __init__ methods?',
        'How does the Python garbage collector work?',
        'Explain the concept of context managers in Python.',
        'What is the difference between a module and a package?',
        'How does the Python import system work?',
        'Explain the concept of metaclasses in Python.',
        'What is the difference between *args and **kwargs?',
        'How does the Python GIL affect multithreading?',
        'Explain the concept of list comprehensions.',
        'What is the difference between is and == operators?',
        'How does the Python interpreter work?',
        'Explain the concept of duck typing in Python.',
        'What is the difference between a shallow copy and a deep copy?',
        'How does the Python threading module work?',
        'Explain the concept of closures in Python.',
        'What is the difference between a class method and a static method?',
        'How does the Python asyncio module work?',
        'Explain the concept of multiple inheritance in Python.'
      ],
      javascript: [
        'Explain the difference between == and === in JavaScript.',
        'What is the event loop in JavaScript?',
        'Explain the concept of closures in JavaScript.',
        'What is the difference between let, const, and var?',
        'How does prototypal inheritance work in JavaScript?',
        'Explain the concept of promises in JavaScript.',
        'What is the difference between call, apply, and bind?',
        'How does the this keyword work in JavaScript?',
        'Explain the concept of hoisting in JavaScript.',
        'What is the difference between synchronous and asynchronous code?',
        'How does the JavaScript garbage collector work?',
        'Explain the concept of currying in JavaScript.',
        'What is the difference between a shallow copy and a deep copy?',
        'How does the JavaScript module system work?',
        'Explain the concept of event delegation.',
        'What is the difference between null and undefined?',
        'How does the JavaScript engine work?',
        'Explain the concept of async/await in JavaScript.',
        'What is the difference between a callback and a promise?',
        'How does the JavaScript scope chain work?',
        'Explain the concept of debouncing and throttling.',
        'What is the difference between a regular function and an arrow function?',
        'How does the JavaScript event loop work with Web APIs?',
        'Explain the concept of higher-order functions.',
        'What is the difference between map, filter, and reduce?'
      ],
      behavioral: [
        'Tell me about a time when you had to work with a difficult team member.',
        'Describe a situation where you had to learn a new technology quickly.',
        'How do you handle competing priorities and deadlines?',
        'Give me an example of when you had to make a decision with incomplete information.',
        'Tell me about a project that didn\'t go as planned and how you handled it.',
        'Describe a time when you had to give constructive feedback to a colleague.',
        'How do you stay motivated when working on long-term projects?',
        'Tell me about a time when you failed and what you learned from it.',
        'How do you handle stress and pressure in the workplace?',
        'Describe a situation where you had to resolve a conflict within your team.',
        'Tell me about a time when you had to persuade others to see your perspective.',
        'Describe a situation where you went above and beyond your job responsibilities.',
        'How do you handle receiving critical feedback?',
        'Tell me about a time when you had to adapt to significant changes.',
        'Describe a project where you took the lead.',
        'How do you mentor junior team members?',
        'Tell me about a time when you had to work with limited resources.',
        'Describe how you prioritize tasks when everything seems urgent.',
        'Tell me about a successful collaboration with cross-functional teams.',
        'How do you handle situations where you disagree with your manager?'
      ],
      case: [
        'How would you design a ride-sharing app like Uber?',
        'What factors would you consider when pricing a new product?',
        'How would you improve customer retention for an e-commerce platform?',
        'What metrics would you track for a social media platform?',
        'How would you approach entering a new market?',
        'Design a strategy to increase user engagement for a mobile app.',
        'How would you reduce operational costs for a delivery service?',
        'What would you do to improve conversion rates on a website?',
        'How would you analyze the success of a new feature launch?',
        'Design a growth strategy for a startup in a competitive market.',
        'How would you prioritize features for a product roadmap?',
        'What would you do if user engagement dropped by 20%?',
        'How would you validate a new business idea?',
        'Design a customer acquisition strategy for a B2B SaaS product.',
        'How would you approach A/B testing for a major UI change?',
        'What metrics would you use to measure product success?',
        'How would you handle a PR crisis for a tech company?',
        'Design a monetization strategy for a free mobile app.',
        'How would you compete with a well-established market leader?',
        'What would you do to improve the onboarding experience?'
      ],
      'system-design': [
        'Design a URL shortening service like bit.ly.',
        'How would you design a chat application like WhatsApp?',
        'Design a notification system for a social media platform.',
        'How would you design a distributed cache system?',
        'Design a rate limiter for an API.',
        'How would you design a scalable file storage system?',
        'Design a real-time analytics dashboard.',
        'How would you design a search engine autocomplete feature?',
        'Design a payment processing system.',
        'How would you design a content delivery network (CDN)?',
        'Design a video streaming platform like YouTube.',
        'How would you design a distributed task scheduler?',
        'Design a web crawler for a search engine.',
        'How would you design a parking lot management system?',
        'Design a hotel booking system.',
        'How would you design a news feed like Facebook?',
        'Design an online multiplayer game backend.',
        'How would you design a recommendation system?',
        'Design a distributed logging system.',
        'How would you design a proximity service like Yelp?'
      ],
      general: [
        'Why are you interested in this position?',
        'Where do you see yourself in 5 years?',
        'What are your greatest strengths and weaknesses?',
        'Why should we hire you?',
        'What questions do you have for us?',
        'What motivates you in your professional career?',
        'How do you keep your skills up to date?',
        'What is your ideal work environment?',
        'Describe your approach to problem-solving.',
        'What are your salary expectations?',
        'What attracted you to our company?',
        'How do you define success?',
        'What is your biggest professional achievement?',
        'Tell me about your current role and responsibilities.',
        'Why are you looking to leave your current position?',
        'What type of work culture do you thrive in?',
        'How do you handle work-life balance?',
        'What are your long-term career goals?',
        'Describe your ideal manager.',
        'What makes you unique as a candidate?'
      ],
      ml: [
        'Explain the difference between supervised and unsupervised learning.',
        'What is overfitting and how do you prevent it?',
        'Explain the bias-variance tradeoff.',
        'How does gradient descent work?',
        'What is the difference between L1 and L2 regularization?',
        'Explain how a neural network learns.',
        'What is backpropagation?',
        'Explain the difference between precision and recall.',
        'What is cross-validation and why is it important?',
        'How do you handle imbalanced datasets?',
        'Explain the difference between bagging and boosting.',
        'What is a confusion matrix?',
        'How does k-means clustering work?',
        'Explain the ROC-AUC curve.',
        'What is feature scaling and why is it important?',
        'Explain the difference between decision trees and random forests.',
        'What is transfer learning?',
        'How do convolutional neural networks work?',
        'Explain the vanishing gradient problem.',
        'What is dropout in neural networks?',
        'How do you choose the number of hidden layers in a neural network?',
        'Explain the difference between batch, mini-batch, and stochastic gradient descent.',
        'What is dimensionality reduction? Name some techniques.',
        'How does PCA work?',
        'What is the difference between generative and discriminative models?'
      ],
      ai: [
        'What is artificial intelligence and how does it differ from machine learning?',
        'Explain how the A* search algorithm works.',
        'What is the difference between DFS and BFS?',
        'How do transformers work in NLP?',
        'Explain the attention mechanism.',
        'What is reinforcement learning?',
        'How does Q-learning work?',
        'Explain the difference between BERT and GPT.',
        'What are word embeddings?',
        'How does object detection work in computer vision?',
        'Explain the YOLO algorithm.',
        'What is transfer learning in deep learning?',
        'How do GANs (Generative Adversarial Networks) work?',
        'Explain the ethical concerns in AI development.',
        'What is explainable AI (XAI)?',
        'How do chatbots work?',
        'Explain the concept of multi-agent systems.',
        'What is computer vision and its applications?',
        'How does natural language understanding differ from generation?',
        'Explain the Turing test and its relevance today.'
      ],
      'data-science': [
        'What is the difference between data science and data analytics?',
        'Explain the steps in a typical data science project.',
        'How do you handle missing data?',
        'What is exploratory data analysis (EDA)?',
        'Explain the central limit theorem.',
        'What is p-value and statistical significance?',
        'How do you detect outliers in a dataset?',
        'Explain the difference between correlation and causation.',
        'What is feature engineering?',
        'How do you evaluate a classification model?',
        'Explain A/B testing methodology.',
        'What is hypothesis testing?',
        'How do you handle categorical variables in ML models?',
        'Explain time series analysis.',
        'What is the curse of dimensionality?',
        'How do you build a recommendation system?',
        'Explain data normalization vs standardization.',
        'What are the key metrics for regression models?',
        'How do you communicate insights to non-technical stakeholders?',
        'Explain the importance of data visualization.'
      ],
      devops: [
        'What is DevOps and why is it important?',
        'Explain the CI/CD pipeline.',
        'What is the difference between containers and virtual machines?',
        'How does Docker work?',
        'Explain Kubernetes architecture.',
        'What is Infrastructure as Code (IaC)?',
        'How does Terraform work?',
        'Explain the Git branching strategy you prefer.',
        'What is blue-green deployment?',
        'How do you monitor applications in production?',
        'Explain the difference between Ansible and Terraform.',
        'What is a microservices architecture?',
        'How do you implement logging in a distributed system?',
        'Explain container orchestration.',
        'What is a service mesh?',
        'How do you handle secrets management?',
        'Explain the concept of immutable infrastructure.',
        'What is continuous monitoring?',
        'How do you implement disaster recovery?',
        'Explain the twelve-factor app methodology.'
      ],
      cloud: [
        'What are the three main cloud service models (IaaS, PaaS, SaaS)?',
        'Explain the difference between public, private, and hybrid cloud.',
        'What is serverless computing?',
        'How does AWS Lambda work?',
        'Explain VPC and subnets in cloud networking.',
        'What is the difference between object storage and block storage?',
        'How do you secure resources in the cloud?',
        'Explain autoscaling in cloud environments.',
        'What is a load balancer and how does it work?',
        'How do you optimize cloud costs?',
        'Explain the shared responsibility model in cloud security.',
        'What is a CDN and how does it work?',
        'How do you implement high availability in the cloud?',
        'Explain cloud migration strategies.',
        'What is the difference between horizontal and vertical scaling?',
        'How does container orchestration work in cloud environments?',
        'Explain disaster recovery in the cloud.',
        'What is multi-region deployment?',
        'How do you monitor cloud resources?',
        'Explain the benefits of managed database services.'
      ],
      cybersecurity: [
        'What is the CIA triad in cybersecurity?',
        'Explain the OWASP Top 10 vulnerabilities.',
        'What is SQL injection and how do you prevent it?',
        'How does XSS (Cross-Site Scripting) work?',
        'Explain the difference between symmetric and asymmetric encryption.',
        'What is a firewall and how does it work?',
        'How do you implement authentication vs authorization?',
        'Explain the concept of zero-trust security.',
        'What is a DDoS attack and how do you mitigate it?',
        'How does HTTPS work?',
        'Explain password hashing and salting.',
        'What is two-factor authentication?',
        'How do you perform a security audit?',
        'Explain the concept of defense in depth.',
        'What is penetration testing?',
        'How do you handle a security incident?',
        'Explain the principle of least privilege.',
        'What is a VPN and how does it work?',
        'How do you secure APIs?',
        'Explain GDPR and its impact on data security.'
      ],
      mobile: [
        'What is the difference between native and cross-platform development?',
        'Explain the Android activity lifecycle.',
        'How does state management work in React Native?',
        'What is the difference between Swift and Objective-C?',
        'Explain the MVVM architecture pattern in mobile apps.',
        'How do you handle offline functionality in mobile apps?',
        'What is the difference between AsyncTask and coroutines in Android?',
        'Explain gesture handling in mobile apps.',
        'How do you optimize mobile app performance?',
        'What is the difference between push and pull notifications?',
        'Explain deep linking in mobile apps.',
        'How do you implement local storage in mobile apps?',
        'What is the difference between Fragment and Activity?',
        'Explain the iOS app lifecycle.',
        'How do you handle different screen sizes in mobile development?',
        'What is dependency injection in mobile apps?',
        'Explain the concept of lazy loading in mobile apps.',
        'How do you implement navigation in Flutter?',
        'What are the best practices for mobile app security?',
        'Explain the process of publishing an app to app stores.'
      ],
      blockchain: [
        'What is blockchain and how does it work?',
        'Explain the difference between Bitcoin and Ethereum.',
        'What is a smart contract?',
        'How does Proof of Work (PoW) consensus work?',
        'Explain the difference between PoW and Proof of Stake (PoS).',
        'What is a cryptocurrency wallet?',
        'How do blockchain transactions work?',
        'Explain the concept of mining.',
        'What is a distributed ledger?',
        'How does blockchain ensure security?',
        'Explain the 51% attack.',
        'What are gas fees in Ethereum?',
        'How do you write a smart contract in Solidity?',
        'Explain the concept of DeFi (Decentralized Finance).',
        'What are NFTs and how do they work?',
        'How does blockchain scalability work?',
        'Explain the Lightning Network.',
        'What is the difference between public and private blockchains?',
        'How do oracles work in blockchain?',
        'Explain the concept of blockchain forks.'
      ],
      mixed: [
        'Explain a technical concept to a non-technical person.',
        'How do you balance technical debt with feature development?',
        'Describe a time when you had to make a technical decision with business impact.',
        'How do you approach code reviews?',
        'What is your experience with agile methodologies?',
        'How do you handle disagreements about technical approaches?',
        'Describe your ideal team structure for a software project.',
        'How do you prioritize bugs versus new features?',
        'What is your approach to documentation?',
        'How do you measure the success of your work?',
        'How do you stay current with technology trends?',
        'Describe your process for learning new technologies.',
        'How do you ensure your code is maintainable?',
        'What is your approach to testing and quality assurance?',
        'How do you handle tight deadlines without compromising quality?',
        'Describe a time when you had to refactor legacy code.',
        'How do you approach performance optimization?',
        'What is your experience with cloud platforms?',
        'How do you contribute to team knowledge sharing?',
        'Describe your approach to security in software development.'
      ]
    };

    // Map interview difficulty to question difficulty
    const difficultyMap = {
      'beginner': 'easy',
      'intermediate': 'medium', 
      'advanced': 'hard'
    };

    // Use subject if provided, otherwise fall back to interviewType
    const questionKey = subject && subject !== 'general' ? subject : interviewType;
    const typeQuestions = questionsBySubject[questionKey] || questionsBySubject.general;
    
    // Filter out previously asked questions
    const availableQuestions = typeQuestions.filter(q => !previousQuestions.includes(q));
    const questionsPool = availableQuestions.length >= count ? availableQuestions : typeQuestions;
    
    // Shuffle questions to add randomness
    const shuffled = [...questionsPool].sort(() => Math.random() - 0.5);
    
    // Generate questions from the shuffled pool
    for (let i = 0; i < count; i++) {
      const questionIndex = i % shuffled.length;
      const questionText = shuffled[questionIndex];
      
      questions.push({
        questionId: `mock_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}`,
        question: questionText,
        category: interviewType,
        difficulty: difficultyMap[difficulty] || 'medium',
        expectedKeywords: [],
        timeLimit: 120,
        order: i + 1
      });
    }

    return questions;
  }
  /**
   * Generate company recommendations based on interview performance and resume content
   */
  async generateCompanyRecommendations(user, interview, resume) {
    try {
      // Prepare the prompt with user profile, interview performance, and resume data
      const prompt = this.buildCompanyRecommendationsPrompt(user, interview, resume);
      
      console.log('Generating company recommendations with prompt:', prompt.substring(0, 200) + '...');
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Raw company recommendations response:', text);
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in company recommendations response');
      }
      
      const jsonData = JSON.parse(jsonMatch[0]);
      return jsonData.companies || [];
    } catch (error) {
      console.error('Error generating company recommendations:', error);
      // Return default companies if there's an error
      return this.getDefaultCompanies(interview, resume);
    }
  }

  /**
   * Build prompt for company recommendations
   */
  buildCompanyRecommendationsPrompt(user, interview, resume) {
    // Extract relevant information from interview performance
    const overallScore = interview.performance?.overallScore || 0;
    const categoryScores = interview.performance?.categoryScores || {};
    const strengths = this.extractPointsFromFeedback(interview.performance?.strengths);
    const weaknesses = this.extractPointsFromFeedback(interview.performance?.weaknesses);
    
    // Extract relevant information from resume
    const resumeSkills = this.extractSkillsFromResume(resume);
    const workExperience = resume?.content?.structuredData?.experience || [];
    const education = resume?.content?.structuredData?.education || [];
    const targetJobRole = resume?.metadata?.targetJobRole || user?.profile?.jobTitle || 'Software Engineer';
    const targetIndustry = resume?.metadata?.targetIndustry || user?.profile?.industry || 'Technology';
    
    return `
You are an expert career advisor. Based on the candidate's interview performance and resume, suggest suitable companies they should consider applying to.

CANDIDATE PROFILE:
- Target Role: ${targetJobRole}
- Target Industry: ${targetIndustry}
- Overall Interview Score: ${overallScore}/100
- Category Scores: ${JSON.stringify(categoryScores)}
- Key Strengths: ${strengths.join(', ') || 'None specified'}
- Areas for Improvement: ${weaknesses.join(', ') || 'None specified'}

RESUME SKILLS:
${resumeSkills.map(skill => `- ${skill}`).join('\n')}

WORK EXPERIENCE:
${workExperience.map(exp => `- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})`).join('\n')}

EDUCATION:
${education.map(edu => `- ${edu.degree} from ${edu.institution} (${edu.startDate} - ${edu.endDate || 'Present'})`).join('\n')}

Based on this information, provide a list of 8-12 companies that would be a good fit for this candidate. Consider:
1. Their skill level (based on interview score)
2. Their target role and industry
3. Their experience level
4. Companies known for hiring in their field
5. Companies with good growth opportunities
6. Companies that match their strengths

Return ONLY a JSON object in this exact format:
{
  "companies": [
    {
      "name": "Company Name",
      "reason": "Brief explanation why this company is a good fit",
      "matchScore": 95
    }
  ]
}

Make sure the JSON is valid and contains exactly the structure specified.
    `;
  }

  /**
   * Extract points from feedback arrays
   */
  extractPointsFromFeedback(feedbackArray) {
    if (!feedbackArray || !Array.isArray(feedbackArray)) return [];
    
    const points = [];
    feedbackArray.forEach(item => {
      if (item.points && Array.isArray(item.points)) {
        points.push(...item.points);
      }
    });
    
    return points;
  }

  /**
   * Extract skills from resume
   */
  extractSkillsFromResume(resume) {
    if (!resume?.content?.structuredData?.skills) return [];
    
    const skills = [];
    resume.content.structuredData.skills.forEach(skillCategory => {
      if (skillCategory.skills && Array.isArray(skillCategory.skills)) {
        skills.push(...skillCategory.skills);
      }
    });
    
    return skills;
  }

  /**
   * Get default company recommendations when AI generation fails
   */
  getDefaultCompanies(interview, resume) {
    const overallScore = interview.performance?.overallScore || 0;
    const targetIndustry = resume?.metadata?.targetIndustry || 'Technology';
    
    // Different company lists based on score and industry
    const companyLists = {
      'Technology': overallScore >= 80 ? [
        { name: 'Google', reason: 'Leading tech company, excellent for senior roles', matchScore: 95 },
        { name: 'Microsoft', reason: 'Strong engineering culture, great growth opportunities', matchScore: 92 },
        { name: 'Amazon', reason: 'Innovative projects, competitive compensation', matchScore: 90 },
        { name: 'Apple', reason: 'Premium products, cutting-edge technology', matchScore: 88 },
        { name: 'Meta', reason: 'Social media leader, fast-paced environment', matchScore: 85 },
        { name: 'Netflix', reason: 'Streaming pioneer, high-performance culture', matchScore: 83 },
        { name: 'Salesforce', reason: 'CRM leader, strong growth trajectory', matchScore: 80 },
        { name: 'Adobe', reason: 'Creative software leader, stable growth', matchScore: 78 }
      ] : overallScore >= 60 ? [
        { name: 'IBM', reason: 'Established tech company, good for mid-level roles', matchScore: 85 },
        { name: 'Oracle', reason: 'Enterprise software leader, stable career path', matchScore: 82 },
        { name: 'SAP', reason: 'Business software giant, global opportunities', matchScore: 80 },
        { name: 'VMware', reason: 'Virtualization pioneer, growing cloud division', matchScore: 78 },
        { name: 'Red Hat', reason: 'Open-source leader, Linux expertise valued', matchScore: 75 },
        { name: 'Splunk', reason: 'Data analytics specialist, strong market position', matchScore: 72 },
        { name: 'Twilio', reason: 'Cloud communications platform, developer-friendly', matchScore: 70 },
        { name: 'Atlassian', reason: 'Collaboration tools leader, remote-friendly', matchScore: 68 }
      ] : [
        { name: 'Deloitte', reason: 'Big Four consulting firm, entry-level friendly', matchScore: 80 },
        { name: 'Accenture', reason: 'Global consulting giant, extensive training programs', matchScore: 78 },
        { name: 'Cognizant', reason: 'IT services provider, good for building experience', matchScore: 75 },
        { name: 'Infosys', reason: 'Global IT services, strong training initiatives', matchScore: 72 },
        { name: 'Tech Mahindra', reason: 'Indian IT major, diverse project exposure', matchScore: 70 },
        { name: 'Wipro', reason: 'Established IT services company, good learning environment', matchScore: 68 },
        { name: 'HCL Technologies', reason: 'Growing IT services firm, competitive entry packages', matchScore: 65 },
        { name: 'Mindtree', reason: 'Mid-sized IT services company, employee-friendly policies', matchScore: 62 }
      ],
      
      'Finance': overallScore >= 80 ? [
        { name: 'Goldman Sachs', reason: 'Top investment bank, prestigious role', matchScore: 95 },
        { name: 'JPMorgan Chase', reason: 'Leading financial institution, tech innovation', matchScore: 92 },
        { name: 'Morgan Stanley', reason: 'Elite investment bank, strong compensation', matchScore: 90 },
        { name: 'Bank of America', reason: 'Major retail and investment bank, diverse opportunities', matchScore: 88 },
        { name: 'Citigroup', reason: 'Global banking giant, international exposure', matchScore: 85 },
        { name: 'BlackRock', reason: 'World\'s largest asset manager, fintech focus', matchScore: 83 },
        { name: 'Visa', reason: 'Payment processing leader, stable growth', matchScore: 80 },
        { name: 'Mastercard', reason: 'Financial services giant, innovation focus', matchScore: 78 }
      ] : overallScore >= 60 ? [
        { name: 'American Express', reason: 'Premium financial services, customer focus', matchScore: 85 },
        { name: 'Capital One', reason: 'Tech-forward bank, data science emphasis', matchScore: 82 },
        { name: 'Wells Fargo', reason: 'Major retail bank, diverse departments', matchScore: 80 },
        { name: 'Charles Schwab', reason: 'Investment services leader, client-centric', matchScore: 78 },
        { name: 'Fidelity Investments', reason: 'Asset management giant, stable career path', matchScore: 75 },
        { name: 'State Street', reason: 'Custody bank, institutional focus', matchScore: 72 },
        { name: 'Northern Trust', reason: 'Wealth management specialist, client service focus', matchScore: 70 },
        { name: 'BNY Mellon', reason: 'Asset servicing leader, global presence', matchScore: 68 }
      ] : [
        { name: 'PwC', reason: 'Big Four accounting firm, entry-level programs', matchScore: 80 },
        { name: 'EY', reason: 'Big Four professional services, diverse practice areas', matchScore: 78 },
        { name: 'KPMG', reason: 'Global professional services, audit and advisory', matchScore: 75 },
        { name: 'Deloitte', reason: 'Big Four consulting, technology services', matchScore: 72 },
        { name: 'Ernst & Young', reason: 'Professional services giant, varied opportunities', matchScore: 70 },
        { name: 'Grant Thornton', reason: 'Mid-tier accounting firm, growth opportunities', matchScore: 68 },
        { name: 'RSM', reason: 'Audit and consulting firm, mid-market focus', matchScore: 65 },
        { name: 'BDO', reason: 'Accounting and consulting services, employee development', matchScore: 62 }
      ],
      
      'Healthcare': overallScore >= 80 ? [
        { name: 'Johnson & Johnson', reason: 'Medical devices and pharma leader, R&D focus', matchScore: 95 },
        { name: 'Pfizer', reason: 'Pharmaceutical giant, innovative drug development', matchScore: 92 },
        { name: 'Merck', reason: 'Global healthcare company, strong research pipeline', matchScore: 90 },
        { name: 'Abbott', reason: 'Medical device manufacturer, diagnostics leader', matchScore: 88 },
        { name: 'Medtronic', reason: 'Medical technology leader, life-saving devices', matchScore: 85 },
        { name: 'Roche', reason: 'Swiss pharma and diagnostics, precision medicine', matchScore: 83 },
        { name: 'Novartis', reason: 'Global pharmaceuticals, innovative treatments', matchScore: 80 },
        { name: 'Gilead Sciences', reason: 'Biotech innovator, antiviral expertise', matchScore: 78 }
      ] : overallScore >= 60 ? [
        { name: 'Eli Lilly', reason: 'Pharmaceutical company, mental health focus', matchScore: 85 },
        { name: 'Bristol-Myers Squibb', reason: 'Biopharma leader, immuno-oncology', matchScore: 82 },
        { name: 'Amgen', reason: 'Biotechnology pioneer, therapeutic proteins', matchScore: 80 },
        { name: 'Biogen', reason: 'Neuroscience specialist, multiple sclerosis focus', matchScore: 78 },
        { name: 'Regeneron', reason: 'Genetic medicine pioneer, monoclonal antibodies', matchScore: 75 },
        { name: 'Vertex Pharmaceuticals', reason: 'Cystic fibrosis leader, rare disease focus', matchScore: 72 },
        { name: 'Seattle Genetics', reason: 'Antibody-drug conjugates, cancer treatment', matchScore: 70 },
        { name: 'Incyte', reason: 'Oncology and inflammation, JAK inhibitor expertise', matchScore: 68 }
      ] : [
        { name: 'McKesson', reason: 'Healthcare distribution leader, logistics focus', matchScore: 80 },
        { name: 'UnitedHealth Group', reason: 'Managed care giant, insurance and services', matchScore: 78 },
        { name: 'CVS Health', reason: 'Pharmacy retailer, health services', matchScore: 75 },
        { name: 'Cardinal Health', reason: 'Medical products distributor, pharmacy services', matchScore: 72 },
        { name: 'AmerisourceBergen', reason: 'Pharmaceutical sourcing, supply chain', matchScore: 70 },
        { name: 'Walgreens Boots Alliance', reason: 'Retail pharmacy chain, health services', matchScore: 68 },
        { name: 'Cigna', reason: 'Health services company, managed care', matchScore: 65 },
        { name: 'Humana', reason: 'Health insurance provider, Medicare focus', matchScore: 62 }
      ]
    };
    
    // Return the appropriate list based on industry and score
    return companyLists[targetIndustry] || companyLists['Technology'];
  }
}

module.exports = new GeminiService(); 