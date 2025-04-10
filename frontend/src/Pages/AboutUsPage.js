import React from 'react';
import { Box, Container, Typography, Grid, Paper, Divider, List, ListItem, ListItemIcon, ListItemText, useTheme } from '@mui/material';
import { DesignServices, Group, Share, School, TravelExplore, Event,Brush, CorporateFare, Star } from '@mui/icons-material';

const AboutUsPage = () => {
  const theme = useTheme();
  
  const features = [
    { icon: <DesignServices />, text: "Seamless transition from browsing to designing" },
    { icon: <Brush />, text: "Tools to experiment with designs and foster creativity" },
    { icon: <Group />, text: "Community-based sharing and collaboration" },
    { icon: <Share />, text: "Easy export and sharing on social media platforms" }
  ];

  const useCases = [
    { icon: <Star />, title: "Influencers", description: "Design Instagram content, Facebook posts, and Twitter visuals to boost engagement" },
    { icon: <CorporateFare />, title: "Corporate Teams", description: "Create standout job ads and visual boards for brainstorming" },
    { icon: <Brush />, title: "Creative Individuals", description: "Express and grow personal creativity through intuitive tools" },
    { icon: <Event />, title: "Event Designers", description: "Build moodboards for venues, decor, and event themes" },
    { icon: <School />, title: "Educational Use", description: "Ideal for students and teachers for visual assignments" },
    { icon: <TravelExplore />, title: "Travelers", description: "Organize travel inspiration and document journeys visually" }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper elevation={2} sx={{ p: 4, mb: 6, borderRadius: 4, backgroundColor: "#214224", color: "#f0f0f0" }}>
        <Typography variant="h4" gutterBottom fontWeight="600">
          Our Vision
        </Typography>

        <Divider sx={{ mb: 3, borderColor: "#f0f0f0" }} />

        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
          In today's digital age, social media is deeply ingrained in our lives. While Pinterest allows users to pin inspirations and Canva offers design tools, the limitation lies in their separation. <strong>Versatile Vertex</strong> combines the calm discovery of Pinterest with the creative freedom of Canva, creating a seamless bridge between inspiration and implementation.
        </Typography>
      </Paper>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 4, height: '100%', borderRadius: 4, backgroundColor: "#214224", color: "#f0f0f0" }}>
            <Typography variant="h5" gutterBottom fontWeight="600">
              Our Mission
            </Typography>

            <Divider sx={{ mb: 3, borderColor: "#f0f0f0" }} />

            <Typography variant="body1" paragraph>
              We aim to simplify content curation and customization, foster creativity, enable skill improvement, and support seamless sharing of designs. Our platform removes the friction between finding inspiration and creating content.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 4, height: '100%', borderRadius: 4, backgroundColor: "#214224", color: "#f0f0f0" }}>
            <Typography variant="h5" gutterBottom fontWeight="600">
              Key Features
            </Typography>

            <Divider sx={{ mb: 3, borderColor: "#f0f0f0" }} />

            <List>
              {features.map((feature, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40, color: "#f0f0f0" }}>
                    {feature.icon}
                  </ListItemIcon>
                  <ListItemText primary={feature.text} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom fontWeight="600" textAlign="center" sx={{ color: "#214224" }}>
          Who Can Benefit
        </Typography>

        <Divider sx={{ mb: 4, borderColor: "#214224" }} />

        <Grid container spacing={3}>
          {useCases.map((useCase, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper elevation={3} sx={{ p: 3, backgroundColor: "#214224", color: "#f0f0f0", height: '100%', borderRadius: 4, transition: 'transform 0.3s, box-shadow 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }}}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: "#f0f0f0" }}>
                  {useCase.icon}
                  <Typography variant="h6" component="h3" sx={{ ml: 1.5 }}>
                    {useCase.title}
                  </Typography>
                </Box>

                <Typography variant="body2">
                  {useCase.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ textAlign: 'center', mb: 6, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, borderRadius: 4, p: 4, color: '#f0f0f0', boxShadow: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight="600">
          Ready to transform your creative workflow?
        </Typography>

        <Typography variant="body1" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
          Join thousands of creators already using Versatile Vertex to bring their ideas to life.
        </Typography>
      </Box>
    </Container>
  );
};

export default AboutUsPage;