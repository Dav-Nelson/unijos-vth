# Open Clarifications: To Confirm with the VTH

## Clinical Approval Workflow
1. What specific roles exist at the clinical record level
Students, Interns, Resident Vets, Lecturer, Consultant, Professor?
Which roles require supervision?
Which roles can supervise others

Answer: All these roles exists
The roles that need supervision are the student and intern roles

2. Are there procedures where even a qualified vet needs senior sign-off?

Answer: Yes, especially in surgical cases, or special procecedures such as ultrasound and x-ray

## Receptionist workflow
3. Will there be a printer at the reception desk?
Inkjet or thermal printer?

Answer: Yes, (black and white printer: I guess that's inkjet)

4. What will the patient card look like (will it be same as the current paper version)?
Answer: Yes, it will look like the current version

## Maintenance
5. After deployment, another developer should be able to see the code base or README.md and know how to maintain the project

Answer: Yes, I'll make sure the code base is optimal and the README.md is clear 

## UNIJOS ICT
6. What programming languages and technologies do the server administrators know?

Answer: They are up to date and know React, and all the techstack I'll be using for this project

7. Do they have experience with PHP, Node.js, python or Docker?

Answer: Yes they do

8. What operating system do the servers run (Linux or Windows servers)

Answer: Couldn't find out that yet, but we're not using the UNIJOS ICT servers until we've exhausted the free cloud servers

9. Can they run Docker containers?

Answer: Yes, they can

10. Do they have PostgreSQL available?

Answer: Yes, they do

11. What is their backup policy. How often and where are backups stored?

Answer: Not sure yet, but we wouldn't be using them for now

12. What is their typical uptime? Do they have planned downtime windows?

Answer: Also couldn't verify this

13. Who has access to the server if I'm unavailable?

Answer: There are staffs who can access and maintain it, or I'll train people to

## Drug / Medication List
14. Where does the medication list come from?
    Who can maintain it?
    Is there a standard formulary currently being used

Yes, there's a standard list and the VTH has a pharmacy

## Clinic Structure needs clarification

Unijos VTH has 3 major clinic divisions and Labs:
    Small Animal Clinic (highest case load)
    Poultry and Fish clinics
    Large Animal clinic
    plus
    Ambulatory / Field Services 

## Labs

   Pathology lab (they do hematology (complete blood count), vaginal cytology, post mortem examination)

   Microbiology Lab (they do Microscopy, Culture and Sensitivity)

   Parasitlogy and Entomology Lab (They do faecal flotation and sedimentation)

1. Will these 3 clinics completely seperate departments with seperate staff, or do some doctors work accross multiple clinics?

Answer: Majority of Doctors are stationed in one clinic because that's their area of expertise, just few go out of their way to attend to cases in other clinics sometimes but that's informal.

2. Will each clinic have it's own receptionist or is it one central reception for all clinics?

Answer: The Small, Large Animal and Ambulatory Clinics will have one receptionist and the Poultry and Fish (A.K.A Avian and Aquatic clinic) will have it's own seperate receptionist

3. Is there a seperate registration form per clinic or one universal form?

Answer: The Small and Large Animal clinics have thesame form while the poultry and fish clinics have a different form

4. For poultry and fish, is the patient an individual animal or an entire flock/pound? (A farmer bringing 500 sick chickens is very different from someone bringing one sick dog)

Answer: It depends on the bird type, for poultry birds, it's treated as a flock, not individual. For exotic birds it's treated as an individual. For fish, it's treated as a poound, not individual

5.  For large animals, do they come to the VTH or does 
   the vet always go to the farm?

   Answer: Some come to the VTH and some requires going to the farm (Note: Large animals include Sheep, goats, pigs, cattle, equine in this context)

**Ambulatory Services**
6. How does ambulatory work currently on paper?
   Who schedules the farm visit?
   What records are kept?
   Is billing done at the farm or back at VTH?
   How do students document ambulatory cases?
   Does ambulatory have a separate case number or use the same numbering system?

   Answer: Ambulatory is done with the same case numbering and it depends on the species, it's recorded thesame way VTH cases are recorded, billing is done in the VTH

7. How far do ambulatory trips typically go?
   (Within Jos? Plateau State? Further?)

Answer: Its within Plateau state

**Student Rotations**
8. How are students assigned to clinics?
   Do they rotate on a fixed schedule? (e.g. 3 weeks per clinic per semester)
   Who manages the rotation schedule?
   Can a student be on two clinics at the same time?

Answer: It's done on a fixed schedule of 3 weeks to 4 weeks depending on the available time in the semester. 3 weeks in each of the clinics, then 3 weeks in the laboratories

9. Does each clinic have its own supervising vet 
    or do supervisors cover multiple clinics?
 Answer: Each clinic has it's own supervising vets

**Billing**
10. Is billing the same across all clinics or does 
    each clinic have its own fee structure?

 Answer: Billing is same across the Small and Large Animal clinic and different in the Avian and Aquatic clinic

11. For ambulatory, is there a travel/callout fee 
    in addition to treatment fees?

Answer: Yes, every billing is done at the VTH

**Priority / MVP Scope**
12. Should the system cover all 3 clinics from day one 
    OR start with Small Animal only (highest case load) 
    and add others later?

Answer: Yes, it will cover all three clinics and the laboratories

## Existing Records and Data Migration

**Context discovered:** A team of students and interns 
are currently documenting thousands of existing paper 
records into Excel spreadsheets.

### Questions to confirm with hospital:

**About the Excel data:**
1. What information is being captured in the Excel 
   spreadsheets? (what columns/fields are they using?)
   → Can you get a copy of the Excel template or a 
   sample file to review?

Answer: Just basic info; You can use placeholders for now, we just need an MVP

2. How many records are there approximately?
Answer: Thousands

3. How far along are the students in documenting them?
Answer: 30%

4. Is one central Excel file being used or multiple 
   files per clinic or per year?
Answer: Multiple  

5. Who owns and manages the Excel files?
Answer: Different individuals, multiple copies

**About migration expectations:**
6. Does the hospital expect ALL historical records 
   to be imported into the new system before go-live?
   → Or is it okay to start fresh with new patients 
   only, and keep Excel as a historical archive?

Answer: We can start afresh but make prrovision for import and updatable features.
Source: Dr. Avazi 8th April, 2026


7. If historical records need to be imported
   what is the deadline expectation?
   → This significantly affects timeline

Answer: The excel spreadsheet is not ready yet. So we'll start afresh for now and import those later

8. After your system is live, do the students 
   continue filling Excel or do they switch to 
   your system immediately?
   → There must be a clear cutover date

   Answer: They switch over to my system immediately and keep filling excel for old records

**About the Excel structure:**
9. Can you get a copy of the Excel template being used?
   → This tells you what fields the hospital already 
   considers important — your forms should align with 
   or improve on this, not conflict with it

   Answer: Just use placeholders for now, I'll get all that later. I just want to come up with a designs they can see.

10. Are the Excel records organized by clinic 
    (small animal, large animal, poultry) or all 
    in one file?

   Answer: They are seperate based on clinic

**About the student team:**
11. How many students/interns are working on 
    the documentation?
    → These people already understand the data 
    and could be valuable testers of your system

    Answer: More than 30 students

12. Is their Excel work connected to coursework 
    or is it voluntary?
    → If it's coursework, there's a deadline — 
    which might create urgency for your system

    Answer: It is voluntary


1. Which clinics should we start with?*
Should the first version cover all clinics (Small Animal, Large Animal, Poultry/Fish + Ambulatory), or should we start with Small Animal only since it has the highest patient load, then add the others later?
Answer: The three clinics and laboratories
Source: Dr. Avazi 8th April, 2026

2. What happens to existing records?*
The hospital currently has records on paper or Excel. There are two realistic options:

Start fresh the system takes on new patients from day one. Old records stay in Excel as a reference archive. Simpler and faster to build.

Import old records:  we move existing records into the new system so everything is in one place. Cleaner long term but adds a few extra weeks to the timeline.

Answer: We can start afresh, but make provisions for import and updates
Source: Dr. Avazi 8th April, 2026

3. Where should the system be hosted?*
The software needs to live somewhere so staff can access it from any computer at the VTH. Two options:

🅐 *University ICT servers* — data stays within Unijos, no external cost. Would need ICT's involvement to set up.

🅑 *Cloud servers* — I handle everything remotely, faster to get started, very reliable. Free for our scale.

Answer: We can start with free cloud server and once it is fully up, we explore the UNIJOS ICT server
Source: Dr. Avazi 8th April, 2026