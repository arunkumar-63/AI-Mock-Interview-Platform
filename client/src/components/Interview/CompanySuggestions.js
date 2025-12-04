import React, { useState, useEffect } from 'react';
import { Briefcase, Building2, MapPin, ExternalLink } from 'lucide-react';
import { interviewAPI } from '../../services/api';

const CompanySuggestions = ({ interviewId, skills = [], score }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        
        // Determine company tier based on score
        const tier = score >= 80 ? 'top' : score >= 60 ? 'mid' : 'entry';
        
        // Categorize skills to determine industry focus
        const techSkills = skills.filter(skill => 
          ['javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'swift', 'kotlin']
            .includes(skill.toLowerCase())
        );
        
        const dataSkills = skills.filter(skill => 
          ['sql', 'nosql', 'data analysis', 'machine learning', 'ai', 'big data', 'statistics']
            .includes(skill.toLowerCase())
        );
        
        const webSkills = skills.filter(skill => 
          ['react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring']
            .includes(skill.toLowerCase())
        );
        
        // Determine primary skill category
        let primaryCategory = 'general';
        if (techSkills.length > 0) primaryCategory = 'tech';
        if (dataSkills.length > dataSkills.length) primaryCategory = 'data';
        if (webSkills.length > Math.max(techSkills.length, dataSkills.length)) primaryCategory = 'web';
        
        // Company database (can be moved to a separate file)
        const companies = {
          top: {
            tech: [
              {
                name: 'Google',
                industry: 'Technology',
                location: 'Mountain View, CA & Global',
                reason: 'Your strong technical skills and problem-solving abilities align with Google\'s engineering culture',
                website: 'https://careers.google.com',
                matchScore: Math.min(100, score + 5)
              },
              {
                name: 'Microsoft',
                industry: 'Software',
                location: 'Redmond, WA & Global',
                reason: 'Your skills match well with Microsoft\'s diverse range of products and services',
                website: 'https://careers.microsoft.com',
                matchScore: Math.min(98, score + 3)
              },
              {
                name: 'Amazon Web Services',
                industry: 'Cloud Computing',
                location: 'Seattle, WA & Global',
                reason: 'Your technical expertise is valuable for AWS cloud solutions and services',
                website: 'https://www.amazon.jobs',
                matchScore: Math.min(95, score + 4)
              }
            ],
            data: [
              {
                name: 'Palantir',
                industry: 'Data Analytics',
                location: 'Denver, CO & Global',
                reason: 'Your data analysis skills are perfect for Palantir\'s data-driven solutions',
                website: 'https://www.palantir.com/careers',
                matchScore: Math.min(97, score + 5)
              },
              {
                name: 'Databricks',
                industry: 'Big Data',
                location: 'San Francisco, CA',
                reason: 'Your expertise in data processing aligns with Databricks\'s data analytics platform',
                website: 'https://www.databricks.com/company/careers',
                matchScore: Math.min(96, score + 4)
              }
            ],
            web: [
              {
                name: 'Netflix',
                industry: 'Streaming & Web',
                location: 'Los Gatos, CA',
                reason: 'Your web development skills are valuable for Netflix\'s streaming platform',
                website: 'https://jobs.netflix.com',
                matchScore: Math.min(95, score + 5)
              },
              {
                name: 'Shopify',
                industry: 'E-commerce',
                location: 'Ottawa, Canada & Remote',
                reason: 'Your web development expertise matches well with Shopify\'s e-commerce platform',
                website: 'https://www.shopify.com/careers',
                matchScore: Math.min(94, score + 4)
              }
            ]
          },
          mid: {
            tech: [
              {
                name: 'IBM',
                industry: 'Technology',
                location: 'Armonk, NY & Global',
                reason: 'Your skills align well with IBM\'s enterprise technology solutions',
                website: 'https://www.ibm.com/careers',
                matchScore: Math.min(85, score + 5)
              },
              {
                name: 'Cisco',
                industry: 'Networking',
                location: 'San Jose, CA',
                reason: 'Your technical background is valuable for Cisco\'s networking solutions',
                website: 'https://www.cisco.com/c/en/us/about/careers.html',
                matchScore: Math.min(82, score + 4)
              }
            ],
            data: [
              {
                name: 'Tableau (Salesforce)',
                industry: 'Data Visualization',
                location: 'Seattle, WA',
                reason: 'Your data skills match well with Tableau\'s data visualization tools',
                website: 'https://www.salesforce.com/company/careers',
                matchScore: Math.min(84, score + 5)
              }
            ],
            web: [
              {
                name: 'Etsy',
                industry: 'E-commerce',
                location: 'Brooklyn, NY',
                reason: 'Your web development skills are a great fit for Etsy\'s marketplace platform',
                website: 'https://www.etsy.com/careers',
                matchScore: Math.min(83, score + 4)
              }
            ]
          },
          entry: {
            tech: [
              {
                name: 'Red Hat (IBM)',
                industry: 'Open Source',
                location: 'Raleigh, NC & Remote',
                reason: 'Great place to grow your technical skills in open source development',
                website: 'https://www.redhat.com/en/jobs',
                matchScore: Math.min(75, score + 5)
              },
              {
                name: 'Rackspace',
                industry: 'Cloud Computing',
                location: 'San Antonio, TX & Remote',
                reason: 'Excellent opportunity to build cloud infrastructure experience',
                website: 'https://jobs.rackspace.com',
                matchScore: Math.min(72, score + 4)
              }
            ],
            data: [
              {
                name: 'MongoDB',
                industry: 'Database',
                location: 'New York, NY',
                reason: 'Great place to develop your database and data management skills',
                website: 'https://www.mongodb.com/careers',
                matchScore: Math.min(78, score + 5)
              },
              {
                name: 'Snowflake',
                industry: 'Cloud Data Platform',
                location: 'Bozeman, MT & Remote',
                reason: 'Ideal for building expertise in cloud data warehousing solutions',
                website: 'https://www.snowflake.com/careers/',
                matchScore: Math.min(82, score + 5)
              },
              {
                name: 'Datadog',
                industry: 'Monitoring & Analytics',
                location: 'New York, NY & Remote',
                reason: 'Great for working with large-scale monitoring and observability platforms',
                website: 'https://www.datadoghq.com/careers/',
                matchScore: Math.min(80, score + 4)
              }
            ],
            web: [
              {
                name: 'HubSpot',
                industry: 'Marketing & Web',
                location: 'Cambridge, MA',
                reason: 'Great environment to grow your web development and marketing tech skills',
                website: 'https://www.hubspot.com/careers',
                matchScore: Math.min(76, score + 4)
              },
              {
                name: 'Wix',
                industry: 'Website Development',
                location: 'Tel Aviv, Israel & Remote',
                reason: 'Excellent for frontend developers interested in website building platforms',
                website: 'https://www.wix.com/jobs',
                matchScore: Math.min(78, score + 5)
              },
              {
                name: 'Squarespace',
                industry: 'Web Publishing',
                location: 'New York, NY',
                reason: 'Great for developers passionate about design and content creation tools',
                website: 'https://www.squarespace.com/careers',
                matchScore: Math.min(77, score + 4)
              }
            ]
          }
        };
        
        // Function to get a random subset of companies
        const getRandomCompanies = (companyList, count) => {
          const shuffled = [...companyList].sort(() => 0.5 - Math.random());
          return shuffled.slice(0, count);
        };

        // Determine how many companies to take from each category based on score
        const techCompanies = companies[tier].tech || [];
        const dataCompanies = companies[tier].data || [];
        const webCompanies = companies[tier].web || [];
        
        // Calculate weights based on skill categories
        const techWeight = techSkills.length / Math.max(1, skills.length);
        const dataWeight = dataSkills.length / Math.max(1, skills.length);
        const webWeight = webSkills.length / Math.max(1, skills.length);
        
        // Calculate how many companies to take from each category
        const totalCompanies = 3;
        const techCount = Math.min(
          Math.ceil(techWeight * totalCompanies * 1.5), // Slight bias towards tech
          techCompanies.length
        );
        const dataCount = Math.min(
          Math.ceil(dataWeight * totalCompanies),
          dataCompanies.length
        );
        const webCount = Math.min(
          Math.ceil(webWeight * totalCompanies),
          webCompanies.length
        );
        
        // Get random companies from each category
        const selectedTech = getRandomCompanies(techCompanies, techCount);
        const selectedData = getRandomCompanies(dataCompanies, dataCount);
        const selectedWeb = getRandomCompanies(webCompanies, webCount);
        
        // Combine and deduplicate
        const allCompanies = [...selectedTech, ...selectedData, ...selectedWeb];
        const seen = new Set();
        const uniqueCompanies = allCompanies.filter(company => {
          if (seen.has(company.name)) return false;
          seen.add(company.name);
          return true;
        }).slice(0, totalCompanies);
        
        // If we don't have enough companies, fill from general pool
        if (uniqueCompanies.length < totalCompanies) {
          const remaining = totalCompanies - uniqueCompanies.length;
          const allCategories = [
            ...techCompanies,
            ...dataCompanies,
            ...webCompanies
          ].filter(company => !seen.has(company.name));
          
          uniqueCompanies.push(
            ...getRandomCompanies(allCategories, remaining)
          );
        }
        
        // Add more general companies for variety
        const generalCompanies = [
          {
            name: 'GitHub (Microsoft)',
            industry: 'Developer Tools',
            location: 'San Francisco, CA & Remote',
            reason: 'Great place to contribute to open source and developer tools',
            website: 'https://github.com/about/careers',
            matchScore: Math.min(85, score + 5)
          },
          {
            name: 'DigitalOcean',
            industry: 'Cloud Hosting',
            location: 'New York, NY & Remote',
            reason: 'Developer-friendly cloud platform with great learning opportunities',
            website: 'https://www.digitalocean.com/careers',
            matchScore: Math.min(82, score + 4)
          },
          {
            name: 'Atlassian',
            industry: 'Developer Tools',
            location: 'Sydney, Australia & Global',
            reason: 'Work on tools that shape how development teams collaborate',
            website: 'https://www.atlassian.com/company/careers',
            matchScore: Math.min(84, score + 5)
          },
          {
            name: 'Twilio',
            industry: 'Cloud Communications',
            location: 'San Francisco, CA & Remote',
            reason: 'Build communication APIs that power modern applications',
            website: 'https://www.twilio.com/company/jobs',
            matchScore: Math.min(83, score + 5)
          },
          {
            name: 'Elastic',
            industry: 'Search & Analytics',
            location: 'Mountain View, CA & Remote',
            reason: 'Work on the Elastic Stack and search technology',
            website: 'https://www.elastic.co/about/careers',
            matchScore: Math.min(82, score + 4)
          },
          {
            name: 'Vercel',
            industry: 'Web Development',
            location: 'San Francisco, CA & Remote',
            reason: 'Build the next generation of web development tools',
            website: 'https://vercel.com/careers',
            matchScore: Math.min(86, score + 5)
          },
          {
            name: 'Stripe',
            industry: 'Fintech',
            location: 'San Francisco, CA & Remote',
            reason: 'Work on the forefront of online payment processing and financial infrastructure',
            website: 'https://stripe.com/jobs',
            matchScore: Math.min(88, score + 5)
          },
          {
            name: 'Notion',
            industry: 'Productivity Software',
            location: 'San Francisco, CA & Remote',
            reason: 'Help build the all-in-one workspace for notes, docs, and collaboration',
            website: 'https://www.notion.so/careers',
            matchScore: Math.min(85, score + 5)
          },
          {
            name: 'Canva',
            industry: 'Design Tools',
            location: 'Sydney, Australia & Remote',
            reason: 'Work on making design accessible to everyone with powerful web-based tools',
            website: 'https://www.canva.com/careers/',
            matchScore: Math.min(86, score + 5)
          }
        ];
        
        while (uniqueCompanies.length < 3 && generalCompanies.length > 0) {
          const company = generalCompanies.shift();
          if (!seen.has(company.name)) {
            seen.add(company.name);
            uniqueCompanies.push(company);
          }
        }
        
        setSuggestions(uniqueCompanies);
      } catch (err) {
        console.error('Error fetching company suggestions:', err);
        setError('Failed to load company suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [interviewId, skills, score]);

  if (loading) {
    return <div className="text-center py-4">Loading company suggestions...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (suggestions.length === 0) {
    return null; // Don't render anything if no suggestions
  }

  return (
    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Briefcase className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-xl font-semibold text-gray-800">Recommended Companies</h3>
      </div>
      <p className="text-gray-600 mb-4">
        Based on your interview performance and skills, we recommend exploring these companies that match your profile:
      </p>
      
      <div className="space-y-4">
        {suggestions.map((company, index) => (
          <div key={`${company.name}-${index}`} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-lg text-gray-900 flex items-center">
                  <Building2 className="w-5 h-5 text-blue-500 mr-2" />
                  {company.name}
                </h4>
                <div className="text-sm text-gray-500 mt-1 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {company.location}
                  <span className="mx-2">•</span>
                  {company.industry}
                  <span className="mx-2">•</span>
                  <span className="font-medium" style={{ color: company.matchScore > 80 ? '#10B981' : company.matchScore > 60 ? '#F59E0B' : '#EF4444' }}>
                    {company.matchScore}% Match
                  </span>
                </div>
                <p className="mt-2 text-gray-700">{company.reason}</p>
              </div>
              <a 
                href={company.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                Visit Website
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>💡 Tip: Customize your application for each company by highlighting relevant skills from your interview.</p>
      </div>
    </div>
  );
};

export default CompanySuggestions;
