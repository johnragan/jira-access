import { jest } from '@jest/globals';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as yourScript from '../src/sortTickets.js';
import { PassThrough } from 'stream';  // Import PassThrough to simulate streams

describe('CSV Processing Tests', () => {
// Define a variable to store the console log spy
let consoleLogSpy;

beforeAll(() => {
  // Create a spy for console.log and store it in consoleLogSpy
  consoleLogSpy = jest.spyOn(global.console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console.log to its original implementation
  consoleLogSpy.mockRestore();
});

  describe('parseDate function', () => {
    it('should return Infinity for empty date', () => {
      const result = yourScript.parseDate('');
      expect(result).toBe(Infinity);
    });

    it('should return a valid timestamp for a proper date string', () => {
      const result = yourScript.parseDate('2024-02-01');
      expect(result).toBeInstanceOf(Date);
      expect(new Date(result).getFullYear()).toBe(2024);
    });

    it('should return Infinity for invalid date strings', () => {
      const result = yourScript.parseDate('invalid-date');
      expect(result).toBe(Infinity);
    });
  });

  describe('sortTickets function', () => {
    it('should sort tickets by Status, Priority, and DueDate', () => {
      const tickets = [
        { Status: 'To Do', Priority: 'High', DueDate: '2024-12-01' },
        { Status: 'In Development', Priority: 'Medium', DueDate: '2024-11-01' },
        { Status: 'Done', Priority: 'Low', DueDate: '' }
      ];

      const sorted = yourScript.sortTickets(tickets);

      expect(sorted[0].Status).toBe('Done');
      expect(sorted[1].Status).toBe('In Development');
      expect(sorted[2].Status).toBe('To Do');
    });
  });

  describe('CSV file handling', () => {
    let fsCreateReadStreamStub;
    let fsPromisesWriteFileStub;

    beforeEach(() => {
      fsCreateReadStreamStub = jest.spyOn(fs, 'createReadStream').mockImplementation(() => new PassThrough());
      fsPromisesWriteFileStub = jest.spyOn(fsPromises, 'writeFile').mockResolvedValue();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should read CSV and process it', async () => {
      // Mock CSV data as a string
      const mockCsvData = `Status,Priority,DueDate\nTo Do,High,2024-12-01\nIn Development,Medium,2024-11-01`;

      // Create a PassThrough stream to simulate reading from a file
      const mockStream = new PassThrough();

      // Stub fs.createReadStream to return the mock stream
      fsCreateReadStreamStub.mockReturnValue(mockStream);

      // Simulate the behavior of the stream emitting data and ending
      setImmediate(() => {
        mockStream.emit('data', Buffer.from(mockCsvData));  // Simulate data event as CSV string in buffer
        mockStream.emit('end');                             // Simulate end event
      });

      const inputFile = 'Jira.csv';
      const outputFile = 'output.csv';

      // Call the processCSV function
      await yourScript.processCSV(inputFile, outputFile);

      // Assert that writeFile was called once with the correct arguments
      expect(fsPromisesWriteFileStub).toHaveBeenCalledTimes(1);
      expect(fsPromisesWriteFileStub).toHaveBeenCalledWith(outputFile, expect.any(String));
    });
  });
});
