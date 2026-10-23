const PDFDocument = require('pdfkit');

function generateResumePdf(resume, res) {
  const info = resume.personal_info || {};
  const summary = (resume.summary || '').trim();
  const education = Array.isArray(resume.education) ? resume.education : [];
  const skills = Array.isArray(resume.skills) ? resume.skills : [];
  const projects = Array.isArray(resume.projects) ? resume.projects : [];
  const experience = Array.isArray(resume.experience) ? resume.experience : [];
  const certifications = Array.isArray(resume.certifications) ? resume.certifications : [];
  const achievements = Array.isArray(resume.achievements) ? resume.achievements : [];

  // Prepare filename (sanitized name)
  const studentName = (info.full_name || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${studentName}_Resume.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    bufferPages: true
  });

  doc.pipe(res);

  const primaryColor = '#0f766e'; // Dark Teal
  const textColor = '#1e293b';    // Dark Slate
  const mutedColor = '#64748b';   // Slate Muted

  // --- HEADER SECTION ---
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(22)
    .text((info.full_name || 'Student Name').toUpperCase(), { align: 'center' });

  doc.moveDown(0.2);

  // Contact line
  const contactParts = [];
  if (info.email) contactParts.push(info.email);
  if (info.phone) contactParts.push(info.phone);
  if (info.linkedin) contactParts.push(info.linkedin.replace(/^https?:\/\//, ''));
  if (info.github) contactParts.push(info.github.replace(/^https?:\/\//, ''));

  if (contactParts.length > 0) {
    doc
      .fillColor(mutedColor)
      .font('Helvetica')
      .fontSize(9.5)
      .text(contactParts.join('  |  '), { align: 'center' });
  }

  doc.moveDown(0.5);

  // Decorative Rule Line
  doc
    .strokeColor('#cbd5e1')
    .lineWidth(1)
    .moveTo(40, doc.y)
    .lineTo(555, doc.y)
    .stroke();

  doc.moveDown(0.8);

  // Section Heading Helper
  const addSectionHeading = (title) => {
    // Check remaining vertical space before section heading
    if (doc.y > 720) {
      doc.addPage();
    }
    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(title.toUpperCase());
    
    const lineY = doc.y + 2;
    doc
      .strokeColor('#0f766e')
      .lineWidth(0.75)
      .moveTo(40, lineY)
      .lineTo(555, lineY)
      .stroke();
    
    doc.moveDown(0.4);
  };

  // 1. PROFESSIONAL SUMMARY
  if (summary) {
    addSectionHeading('Professional Summary');
    doc
      .fillColor(textColor)
      .font('Helvetica')
      .fontSize(9.5)
      .text(summary, { align: 'justify', lineGap: 2 });
    doc.moveDown(0.8);
  }

  // 2. EDUCATION
  const validEdu = education.filter(e => e.degree || e.college);
  if (validEdu.length > 0) {
    addSectionHeading('Education');
    validEdu.forEach((edu) => {
      if (doc.y > 740) doc.addPage();

      doc
        .fillColor(textColor)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(edu.degree || 'Degree Program', { continued: true })
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor(mutedColor)
        .text(`  —  ${edu.college || ''}`, { align: 'left' });

      const subLine = [];
      if (edu.year) subLine.push(`Duration: ${edu.year}`);
      if (edu.cgpa) subLine.push(`CGPA/Score: ${edu.cgpa}`);

      if (subLine.length > 0) {
        doc
          .fillColor(mutedColor)
          .font('Helvetica-Oblique')
          .fontSize(9)
          .text(subLine.join('  •  '));
      }
      doc.moveDown(0.4);
    });
    doc.moveDown(0.4);
  }

  // 3. SKILLS
  const validSkills = skills.filter(s => s && s.trim());
  if (validSkills.length > 0) {
    addSectionHeading('Technical & Core Skills');
    doc
      .fillColor(textColor)
      .font('Helvetica')
      .fontSize(9.5)
      .text(validSkills.join('  •  '), { lineGap: 3 });
    doc.moveDown(0.8);
  }

  // 4. PROJECTS
  const validProjects = projects.filter(p => p.title || p.description);
  if (validProjects.length > 0) {
    addSectionHeading('Projects');
    validProjects.forEach((proj) => {
      if (doc.y > 730) doc.addPage();

      doc
        .fillColor(textColor)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(proj.title || 'Project Title', { continued: Boolean(proj.tech) });

      if (proj.tech) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(9)
          .fillColor(mutedColor)
          .text(`  (${proj.tech})`);
      } else {
        doc.text('');
      }

      if (proj.link) {
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor('#2563eb')
          .text(proj.link);
      }

      if (proj.description) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(textColor)
          .text(`• ${proj.description}`, { lineGap: 2 });
      }
      doc.moveDown(0.5);
    });
    doc.moveDown(0.3);
  }

  // 5. EXPERIENCE
  const validExp = experience.filter(e => e.org || e.role);
  if (validExp.length > 0) {
    addSectionHeading('Work Experience & Internships');
    validExp.forEach((exp) => {
      if (doc.y > 730) doc.addPage();

      doc
        .fillColor(textColor)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(exp.role || 'Role', { continued: Boolean(exp.org) })
        .font('Helvetica')
        .fillColor(mutedColor)
        .text(` at ${exp.org || ''}`);

      if (exp.duration) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(8.5)
          .fillColor(mutedColor)
          .text(exp.duration);
      }

      if (exp.description) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(textColor)
          .text(`• ${exp.description}`, { lineGap: 2 });
      }
      doc.moveDown(0.5);
    });
    doc.moveDown(0.3);
  }

  // 6. CERTIFICATIONS
  const validCerts = certifications.filter(c => c.name);
  if (validCerts.length > 0) {
    addSectionHeading('Certifications');
    validCerts.forEach((cert) => {
      if (doc.y > 740) doc.addPage();
      const certLine = `• ${cert.name}${cert.org ? ` — ${cert.org}` : ''}${cert.year ? ` (${cert.year})` : ''}`;
      doc
        .fillColor(textColor)
        .font('Helvetica')
        .fontSize(9)
        .text(certLine, { lineGap: 2 });
    });
    doc.moveDown(0.8);
  }

  // 7. ACHIEVEMENTS
  const validAch = achievements.filter(a => typeof a === 'string' ? a.trim() : a);
  if (validAch.length > 0) {
    addSectionHeading('Achievements & Honors');
    validAch.forEach((ach) => {
      if (doc.y > 740) doc.addPage();
      doc
        .fillColor(textColor)
        .font('Helvetica')
        .fontSize(9)
        .text(`• ${ach}`, { lineGap: 2 });
    });
    doc.moveDown(0.8);
  }

  // Finalize PDF
  doc.end();
}

module.exports = { generateResumePdf };
