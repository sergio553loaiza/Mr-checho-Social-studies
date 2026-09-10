import { Activity } from '../types';

export const FOLLOW_UP_1_ACTIVITY: Activity = {
  id: 'follow-up-1-democracy-challenge',
  title: 'Follow Up 1: Democracy Mastery Challenge',
  description:
    'Official 20-question evaluation for 4th Grade covering democracy, voting, civic duties, rights, freedom, and community participation.',
  iconName: 'Award',
  topic: 'Civics / Democracy & Citizenship',
  category: 'Civics & Citizenship',
  gradeLevel: '4th Grade (4A, 4B, 4C)',
  grade: '4',
  estimatedMinutes: 20,
  activityType: 'follow-up',
  questions: [
    {
      id: 'fu1-q1',
      type: 'MC',
      concept: 'DEMOCRACY',
      questionText: '1. What is the main characteristic of a DEMOCRATIC system?',
      options: [
        'Laws are created exclusively by judges without public consultation.',
        'Power belongs to the citizens, who participate and vote for representatives.',
        'Only citizens born in the capital city have the right to select leaders.',
        'The leader is chosen automatically based on seniority in government.',
      ],
      correctAnswerIndex: 1,
      correctAnswerText: 'Power belongs to the citizens, who participate and vote for representatives.',
      explanation:
        'In a democracy, supreme power is vested in the people and exercised by them directly or through elected representatives.',
      points: 1,
    },
    {
      id: 'fu1-q2',
      type: 'DROP',
      concept: 'ELECTION',
      questionText:
        '2. Complete the sentence: During an official ________, citizens cast votes to choose their government representatives.',
      options: ['Select an answer...', 'PARLIAMENT', 'ELECTION', 'DEBATE', 'CONSTITUTION'],
      correctAnswerIndex: 2,
      correctAnswerText: 'ELECTION',
      explanation: 'An ELECTION is the formal process of voting to choose candidate representatives.',
      points: 1,
    },
    {
      id: 'fu1-q3',
      type: 'MC',
      concept: 'VOTE',
      questionText:
        '3. When selecting a class representative, what is the most responsible criterion for your VOTE?',
      options: [
        'Voting for whoever the majority of the class says you should vote for.',
        'Selecting a classmate because they are your closest personal friend.',
        'Choosing the candidate who promises unrealistic rewards to get elected.',
        'Voting for the candidate who presents clear proposals to help the whole class.',
      ],
      correctAnswerIndex: 3,
      correctAnswerText:
        'Voting for the candidate who presents clear proposals to help the whole class.',
      explanation:
        'Responsible voting considers realistic proposals that benefit the collective interest.',
      points: 1,
    },
    {
      id: 'fu1-q4',
      type: 'MC',
      concept: 'RIGHTS',
      questionText: '4. Which of the following statements correctly describes HUMAN RIGHTS?',
      options: [
        'They are basic protections and freedoms guaranteed to every human being equally.',
        'They are privileges awarded only to citizens who obey every rule perfectly.',
        'They are special benefits that adults earn after working for many years.',
        'They are temporary permissions granted by local government authorities.',
      ],
      correctAnswerIndex: 0,
      correctAnswerText:
        'They are basic protections and freedoms guaranteed to every human being equally.',
      explanation:
        'Human rights belong to all individuals regardless of status, background, or age.',
      points: 1,
    },
    {
      id: 'fu1-q5',
      type: 'DROP',
      concept: 'DUTIES',
      questionText:
        '5. Obeying community rules, respecting others, and taking care of public property are civic ________.',
      options: ['Select an answer...', 'DUTIES', 'RIGHTS', 'OPINIONS', 'FREEDOMS'],
      correctAnswerIndex: 1,
      correctAnswerText: 'DUTIES',
      explanation:
        'DUTIES are moral or legal responsibilities that citizens must fulfill to maintain order.',
      points: 1,
    },
    {
      id: 'fu1-q6',
      type: 'MC',
      concept: 'FREEDOM',
      questionText:
        '6. Freedom of speech gives citizens the right to state their views. What is its proper limit?',
      options: [
        'It allows expressing any idea, even if it spreads falsehoods or harms someone’s dignity.',
        'It only permits expressing thoughts that have been pre-approved by an authority.',
        'It allows sharing opinions peacefully while respecting the rights and reputation of others.',
        'It can only be used during formal public meetings or debates.',
      ],
      correctAnswerIndex: 2,
      correctAnswerText:
        'It allows sharing opinions peacefully while respecting the rights and reputation of others.',
      explanation:
        'Freedom of expression must be balanced with the responsibility not to harm others.',
      points: 1,
    },
    {
      id: 'fu1-q7',
      type: 'MC',
      concept: 'LIBERTY',
      questionText:
        '7. Why must individual LIBERTY be balanced with common rules in a community?',
      options: [
        'Because individual freedom is less important than total government control.',
        'Because rules are designed to prevent citizens from making personal choices.',
        'To ensure everyone in a city thinks and acts in the exact same way.',
        'To ensure that one person’s choices do not endanger or violate the rights of others.',
      ],
      correctAnswerIndex: 3,
      correctAnswerText:
        'To ensure that one person’s choices do not endanger or violate the rights of others.',
      explanation:
        'Personal liberty requires boundaries so everyone can enjoy safety and equal rights.',
      points: 1,
    },
    {
      id: 'fu1-q8',
      type: 'DROP',
      concept: 'GOVERNMENT',
      questionText:
        '8. The system of authorities responsible for creating laws, maintaining order, and providing public services is the ________.',
      options: ['Select an answer...', 'COMMUNITY', 'ELECTION', 'GOVERNMENT', 'CITIZENSHIP'],
      correctAnswerIndex: 3,
      correctAnswerText: 'GOVERNMENT',
      explanation:
        'The GOVERNMENT is the official body that administers laws and public policies.',
      points: 1,
    },
    {
      id: 'fu1-q9',
      type: 'MC',
      concept: 'DECISIONS',
      questionText:
        '9. How should a fair democratic DECISION be made in a group project when members disagree?',
      options: [
        'The member who speaks first decides for the entire group.',
        'The group discusses options, listens to all views, and votes to reach a decision.',
        'The student with the highest academic grade makes the final choice.',
        'The team splits up and completes separate projects without agreeing.',
      ],
      correctAnswerIndex: 1,
      correctAnswerText:
        'The group discusses options, listens to all views, and votes to reach a decision.',
      explanation:
        'Democratic decision-making relies on dialogue, consideration of ideas, and voting.',
      points: 1,
    },
    {
      id: 'fu1-q10',
      type: 'MC',
      concept: 'IDEAS',
      questionText: '10. Why is diversity of IDEAS important during group problem-solving?',
      options: [
        'It shows which group members have weaker arguments.',
        'It makes debate longer so less work has to be done.',
        'It guarantees that every single proposal will be implemented.',
        'It allows the group to compare options and find more effective solutions.',
      ],
      correctAnswerIndex: 3,
      correctAnswerText:
        'It allows the group to compare options and find more effective solutions.',
      explanation:
        'Considering multiple perspectives leads to broader analysis and better solutions.',
      points: 1,
    },
    {
      id: 'fu1-q11',
      type: 'DROP',
      concept: 'OPINIONS',
      questionText:
        '11. Responsible citizens treat different ________ with respect, even if they do not share them.',
      options: ['Select an answer...', 'LAWS', 'OPINIONS', 'DUTIES', 'GOVERNMENTS'],
      correctAnswerIndex: 2,
      correctAnswerText: 'OPINIONS',
      explanation: 'Respecting diverse OPINIONS fosters healthy debate and mutual respect.',
      points: 1,
    },
    {
      id: 'fu1-q12',
      type: 'MC',
      concept: 'PARTICIPATION',
      questionText:
        '12. Which action is an example of active CIVIC PARTICIPATION at school?',
      options: [
        'Reporting school problems to class representatives and suggesting improvements.',
        'Following rules quietly without taking interest in school events.',
        'Allowing student council members to make decisions without public feedback.',
        'Focusing only on personal tasks while ignoring school initiatives.',
      ],
      correctAnswerIndex: 0,
      correctAnswerText:
        'Reporting school problems to class representatives and suggesting improvements.',
      explanation:
        'Civic participation means actively engaging to improve community conditions.',
      points: 1,
    },
    {
      id: 'fu1-q13',
      type: 'DROP',
      concept: 'EXPRESS',
      questionText:
        '13. Freedom of assembly allows citizens to gather peacefully to ________ their collective views.',
      options: ['Select an answer...', 'ENFORCE', 'ELECT', 'EXPRESS', 'VOTE'],
      correctAnswerIndex: 3,
      correctAnswerText: 'EXPRESS',
      explanation: 'To EXPRESS means to make thoughts, feelings, or opinions known.',
      points: 1,
    },
    {
      id: 'fu1-q14',
      type: 'MC',
      concept: 'REPRESENT',
      questionText:
        '14. What is the primary responsibility of an elected Student Representative?',
      options: [
        'To make decisions based entirely on their personal preferences.',
        'To assign tasks and duties to other students.',
        'To listen to and advocate for the interests of all the students they represent.',
        'To receive special permissions from school directors.',
      ],
      correctAnswerIndex: 2,
      correctAnswerText:
        'To listen to and advocate for the interests of all the students they represent.',
      explanation:
        'Representatives act on behalf of the group that elected them, not just themselves.',
      points: 1,
    },
    {
      id: 'fu1-q15',
      type: 'MC',
      concept: 'CREATE',
      questionText: '15. By applying democratic values daily, students help CREATE...',
      options: [
        'An environment where rules change constantly according to who asks.',
        'A competitive system where only leaders can express their ideas.',
        'A classroom where decisions are made without public discussion.',
        'A respectful community where everyone feels included and protected.',
      ],
      correctAnswerIndex: 3,
      correctAnswerText:
        'A respectful community where everyone feels included and protected.',
      explanation: 'Democratic values build inclusive, fair, and respectful environments.',
      points: 1,
    },
    {
      id: 'fu1-q16',
      type: 'MC',
      concept: 'LAWS & CONSTITUTION',
      questionText:
        '16. What is the primary function of a country’s CONSTITUTION?',
      options: [
        'To list all the daily tasks that citizens must execute.',
        'To set the fundamental laws, guarantee rights, and define power boundaries.',
        'To outline the temporary rules created by the president each year.',
        'To describe the guidelines for school curricula across the nation.',
      ],
      correctAnswerIndex: 1,
      correctAnswerText:
        'To set the fundamental laws, guarantee rights, and define power boundaries.',
      explanation:
        'A constitution is the supreme law defining government limits and basic rights.',
      points: 1,
    },
    {
      id: 'fu1-q17',
      type: 'MATCH',
      concept: 'CONCEPT MATCHING',
      questionText: '17. Match each term with its correct definition:',
      options: [],
      pairs: [
        {
          term: 'RIGHTS',
          options: [
            'Fundamental protections guaranteed to all citizens',
            'Legal or moral obligations citizens must fulfill',
          ],
          correct: 'Fundamental protections guaranteed to all citizens',
        },
        {
          term: 'DUTIES',
          options: [
            'Fundamental protections guaranteed to all citizens',
            'Legal or moral obligations citizens must fulfill',
          ],
          correct: 'Legal or moral obligations citizens must fulfill',
        },
      ],
      correctAnswerIndex: 0,
      correctAnswerText:
        'RIGHTS: Fundamental protections guaranteed to all citizens | DUTIES: Legal or moral obligations citizens must fulfill',
      explanation:
        'Rights are fundamental guarantees; duties are obligatory responsibilities that keep society balanced.',
      points: 1,
    },
    {
      id: 'fu1-q18',
      type: 'MC',
      concept: 'RESPECTING RESULTS',
      questionText:
        '18. What is the democratic way to respond when your preferred candidate loses an election?',
      options: [
        'Refuse to follow any decisions made by the new elected representative.',
        'Demand an immediate re-vote until your candidate wins.',
        'Accept the outcome, respect the majority decision, and participate constructively.',
        'Criticize classmates who voted for the winning option.',
      ],
      correctAnswerIndex: 2,
      correctAnswerText:
        'Accept the outcome, respect the majority decision, and participate constructively.',
      explanation:
        'Democracy requires accepting majority outcomes while continuing constructive participation.',
      points: 1,
    },
    {
      id: 'fu1-q19',
      type: 'MC',
      concept: 'INCLUSION',
      questionText: '19. How is democratic INCLUSION demonstrated in a team task?',
      options: [
        'Assigning main tasks only to the most outspoken students.',
        'Ensuring all members have an equal chance to contribute their skills and views.',
        'Letting the teacher decide how every individual student should participate.',
        'Allowing only majority group members to vote on decisions.',
      ],
      correctAnswerIndex: 1,
      correctAnswerText:
        'Ensuring all members have an equal chance to contribute their skills and views.',
      explanation:
        'Inclusion ensures everyone has an equal opportunity to participate and contribute.',
      points: 1,
    },
    {
      id: 'fu1-q20',
      type: 'DROP',
      concept: 'COMMUNITY',
      questionText:
        '20. Working together through dialogue and democratic participation strengthens the entire ________.',
      options: ['Select an answer...', 'GOVERNMENT', 'ELECTION', 'PARLIAMENT', 'COMMUNITY'],
      correctAnswerIndex: 4,
      correctAnswerText: 'COMMUNITY',
      explanation:
        'Active civic participation strengthens the social fabric of the community.',
      points: 1,
    },
  ],
};
