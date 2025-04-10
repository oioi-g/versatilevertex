import React, { useState } from 'react';
import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails, Divider, useTheme } from '@mui/material';
import { ExpandMore, Build, Share, Group } from '@mui/icons-material';

const FAQsPage = () => {
  const [expanded, setExpanded] = useState(null);

  const theme = useTheme();

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : null);
  };

  const faqCategories = [
    {
      title: "Features & Capabilities",
      icon: <Build sx={{ color: '#214224' }} />,
      questions: [
        {
          question: "Can I edit images directly from the discovery feed?",
          answer: "Yes! Simply click any image in your feed to open our built-in editor. No need to download and re-upload to another app - edit immediately while maintaining inspiration context."
        },
        {
          question: "What design tools are available?",
          answer: "Our editor includes cropping, text overlays, templates, and advanced tools like transparency effects - everything you'd expect from professional design software."
        }
      ]
    },
    {
      title: "Content & Copyright",
      icon: <Share sx={{ color: '#214224' }} />,
      questions: [
        {
          question: "What types of images can I use?",
          answer: "We primarily provide open-source images. Copyrighted images will display watermarks unless properly licensed. Always check image usage rights before publishing."
        },
        {
          question: "How do I protect my original designs?",
          answer: "While we can't prevent all misuse, we recommend adding watermarks to sensitive work. Our reporting system helps address copyright violations."
        },
        {
          question: "Why does the app consume so much data?",
          answer: "High-quality images and design elements require significant data."
        }
      ]
    },
    {
      title: "Use Cases",
      icon: <Group sx={{ color: '#214224' }} />,
      questions: [
        {
          question: "How can influencers benefit from Versatile Vertex?",
          answer: "Create eye-catching Instagram posts, Facebook covers, and Twitter headers directly from inspiration you find. Maintain consistent branding while experimenting with new styles."
        },
        {
          question: "Can businesses use this for professional purposes?",
          answer: "Yes! HR teams create standout job ads, marketing teams brainstorm campaigns, and product teams visualize concepts - all with collaborative features for enterprises."
        },
        {
          question: "Is this suitable for education?",
          answer: "Perfect for students creating visual projects and teachers designing engaging lesson materials. Our platform encourages creative learning."
        },
        {
          question: "How can event planners use this tool?",
          answer: "Build moodboards for venues, decorations, and themes. Share concepts with clients and make real-time adjustments during planning sessions."
        },
        {
          question: "Is this useful for personal hobbies?",
          answer: "Absolutely! Whether you're a traveler creating visual journals or an artist exploring styles, our platform adapts to your creative needs."
        }
      ]
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
        {faqCategories.map((category, index) => (
            <Box key={index} sx={{ mb: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, color: '#214224' }}>
                    {category.icon}
                    <Typography variant="h4" sx={{ ml: 1.5, color: '#214224' }}>
                        {category.title}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 3, borderColor: '#214224' }} />

                {category.questions.map((item, qIndex) => (
                    <Accordion key={qIndex} expanded={expanded === `panel${index}-${qIndex}`} onChange={handleChange(`panel${index}-${qIndex}`)} elevation={2} sx={{ mb: 2, borderRadius: '8px !important', backgroundColor: "#214224", color: '#f0f0f0', '&:before': { display: 'none' }}}>
                        <AccordionSummary expandIcon={<ExpandMore sx={{ color: '#f0f0f0' }} />} sx={{ backgroundColor: '#214224', borderRadius: '8px 8px 0 0', '&.Mui-expanded': { minHeight: '48px', borderBottom: '1px solid #f0f0f0' }}}>
                            <Typography variant="h6" fontWeight="500">
                                {item.question}
                            </Typography>
                        </AccordionSummary>

                        <AccordionDetails sx={{ backgroundColor: '#29502a', borderRadius: '0 0 8px 8px' }}>
                            <Typography variant="body1">
                                {item.answer}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        ))}
        
        <Box sx={{ textAlign: 'center', mb: 6, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, borderRadius: 4, p: 4, color: '#f0f0f0', boxShadow: 3 }}>
            <Typography variant="h5" gutterBottom fontWeight="600">
                Still have questions?
            </Typography>

            <Typography variant="body1" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                Reach out to us at <strong>andok3268@gmail.com</strong> <br />
                and we will be happy to help!🦋
            </Typography>
        </Box>
    </Container>
  );
};

export default FAQsPage;